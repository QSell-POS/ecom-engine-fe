#!/usr/bin/env bash
# First run on a fresh Amazon Linux 2023 or Ubuntu 22.04/24.04 instance:
# installs Docker, clones the repo, and leaves you one edit away from a deploy.
#
#   bash deploy/bootstrap-ec2.sh
#
# The repo is private, so the clone goes over SSH and needs a deploy key on
# this instance (see docs/deploy-ec2.md). This script generates the keypair if
# there is none and stops with the public half printed, so you can paste it
# into GitHub before re-running.
#
# Idempotent: re-running it skips what is already in place.
set -Eeuo pipefail

REPO_URL="${REPO_URL:-git@github.com:QSell-POS/ecom-engine-fe.git}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/id_ed25519}"
REPO_DIR="${REPO_DIR:-$HOME/ecom-engine-fe}"
# On an existing clone, stay on whatever branch is checked out: switching it
# silently would discard the branch the box is actually running.
if [[ -z "${BRANCH:-}" && -d "$REPO_DIR/.git" ]]; then
  BRANCH="$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)"
fi
BRANCH="${BRANCH:-main}"

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[31mError: %s\033[0m\n' "$*" >&2; exit 1; }

[[ "$(id -u)" != 0 ]] || die "Run this as the instance's normal user (ec2-user or ubuntu), not root."

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
else
  die "Cannot identify the distribution."
fi

log "Installing packages ($PRETTY_NAME)"
case "$ID" in
  amzn)
    sudo dnf -y update
    sudo dnf -y install docker git
    # Compose v2 as a CLI plugin, which is not in the Amazon Linux repos.
    COMPOSE_DIR=/usr/libexec/docker/cli-plugins
    sudo mkdir -p "$COMPOSE_DIR"
    if [[ ! -x "$COMPOSE_DIR/docker-compose" ]]; then
      sudo curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
        -o "$COMPOSE_DIR/docker-compose"
      sudo chmod +x "$COMPOSE_DIR/docker-compose"
    fi
    ;;
  ubuntu|debian)
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl git gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
      sudo curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
      sudo chmod a+r /etc/apt/keyrings/docker.asc
    fi
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID $VERSION_CODENAME stable" \
      | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ;;
  *) die "Unsupported distribution: $ID. Install Docker and compose v2, then run deploy/deploy.sh." ;;
esac

log "Enabling Docker"
sudo systemctl enable --now docker
# So docker works without sudo. It takes effect on the next login, which is
# why the rest of this script still uses sudo where it must.
sudo usermod -aG docker "$USER"

# Deploy key, so git works here and from cron without a password prompt.
if [[ "$REPO_URL" == git@* ]]; then
  log "Checking the deploy key"
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"

  # Pin GitHub's host key, or a non-interactive git would hang on the prompt.
  if ! grep -q "^github.com " "$HOME/.ssh/known_hosts" 2>/dev/null; then
    ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null
    chmod 600 "$HOME/.ssh/known_hosts"
  fi

  if [[ ! -f "$DEPLOY_KEY" ]]; then
    ssh-keygen -t ed25519 -N "" -C "ecom-engine-fe deploy @ $(hostname)" -f "$DEPLOY_KEY" >/dev/null
    printf '
[1mAdd this as a deploy key, then run this script again:[0m
'
    printf '  GitHub > the repo > Settings > Deploy keys > Add deploy key
'
    printf '  Leave "Allow write access" unchecked.

'
    cat "$DEPLOY_KEY.pub"
    printf '
'
    exit 0
  fi

  # ssh -T against GitHub always exits non-zero (no shell access), so the
  # output is the signal, not the status.
  SSH_OUT="$(ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$DEPLOY_KEY" -T git@github.com 2>&1 || true)"

  if [[ "$SSH_OUT" != *"successfully authenticated"* ]]; then
    printf '
[1mGitHub did not accept this key. What ssh said:[0m

'
    printf '%s

' "$SSH_OUT"
    printf '[1mThe key on this instance:[0m
'
    ssh-keygen -lf "$DEPLOY_KEY.pub"
    printf '
Compare that SHA256 with the one shown at
'
    printf '  https://github.com/QSell-POS/ecom-engine-fe/settings/keys
'
    printf 'If they match and ssh timed out, outbound port 22 is blocked — see
'
    printf 'docs/deploy-ec2.md, "SSH to GitHub is blocked".

'
    die "Deploy key not authorised."
  fi
  echo "Deploy key accepted: ${SSH_OUT%%,*}"
fi

log "Fetching the repo"
if [[ -d "$REPO_DIR/.git" ]]; then
  git -C "$REPO_DIR" fetch --prune origin
  git -C "$REPO_DIR" checkout "$BRANCH"
  git -C "$REPO_DIR" reset --hard "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
[[ -f .env ]] || cp deploy/.env.example .env

log "Installing the boot unit"
sudo tee /etc/systemd/system/ecom-engine-fe.service >/dev/null <<UNIT
[Unit]
Description=ecom-engine-fe (Next.js + Nginx)
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$REPO_DIR
User=$USER
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable ecom-engine-fe.service

log "Scheduling certificate renewal"
# Certbot renews only when a certificate is within 30 days of expiry, so a
# weekly run is enough and never hits the rate limit.
CRON_LINE="0 3 * * 1 cd $REPO_DIR && bash deploy/deploy.sh --no-pull --tls >> $REPO_DIR/deploy/renew.log 2>&1"
( crontab -l 2>/dev/null | grep -Fv 'deploy/deploy.sh --no-pull --tls'; echo "$CRON_LINE" ) | crontab -

cat <<NEXT

Bootstrap done.

Next, on this instance:

  1. nano $REPO_DIR/.env          # API_URL, API_KEY, ADMIN_DOMAIN, ROOT_DOMAIN, CLOUDFLARE_API_TOKEN, CERTBOT_EMAIL
  2. Point ADMIN_DOMAIN's A record and a *.ROOT_DOMAIN wildcard A record at
     this instance's public IP, and open ports 80 and 443 in its security group.
  3. newgrp docker                # or log out and back in, so docker needs no sudo
  4. cd $REPO_DIR && bash deploy/deploy.sh --tls

After that, every later deploy is just:

  cd $REPO_DIR && bash deploy/deploy.sh

NEXT
