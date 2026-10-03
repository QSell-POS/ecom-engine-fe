#!/usr/bin/env bash
# First run on a fresh Amazon Linux 2023 or Ubuntu 22.04/24.04 instance:
# installs Docker, clones the repo, and leaves you one edit away from a deploy.
#
#   curl -fsSL https://raw.githubusercontent.com/QSell-POS/ecom-engine-fe/main/deploy/bootstrap-ec2.sh | bash
#
# or, once the repo is on the box:
#
#   bash deploy/bootstrap-ec2.sh
#
# Idempotent: re-running it skips what is already in place.
set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/QSell-POS/ecom-engine-fe.git}"
REPO_DIR="${REPO_DIR:-$HOME/ecom-engine-fe}"
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

  1. nano $REPO_DIR/.env          # API_URL, API_KEY, ADMIN_DOMAIN, SHOP_DOMAIN, CERTBOT_EMAIL
  2. Point both domains' A records at this instance's public IP, and open
     ports 80 and 443 in its security group.
  3. newgrp docker                # or log out and back in, so docker needs no sudo
  4. cd $REPO_DIR && bash deploy/deploy.sh --tls

After that, every later deploy is just:

  cd $REPO_DIR && bash deploy/deploy.sh

NEXT
