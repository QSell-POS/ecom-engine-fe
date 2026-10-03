#!/usr/bin/env bash
# One command: pull, install, build, run.
#
#   bash deploy/deploy.sh            # pull + rebuild + restart
#   bash deploy/deploy.sh --tls      # also issue/renew the certificates
#   bash deploy/deploy.sh --no-pull  # rebuild what is already checked out
#
# Safe to re-run. Nothing here is interactive, so it also works from cron or
# a CI runner over SSH.
set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

PULL=1
TLS=0
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    --tls) TLS=1 ;;
    -h|--help) sed -n '2,12p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[31mError: %s\033[0m\n' "$*" >&2; exit 1; }

[[ -f .env ]] || die "No .env here. Run: cp deploy/.env.example .env && nano .env"

# Compose v2 is a docker subcommand; the v1 binary is not supported.
docker compose version >/dev/null 2>&1 || die "docker compose v2 is missing. Run deploy/bootstrap-ec2.sh first."

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${API_URL:?API_URL is not set in .env}"
: "${API_KEY:?API_KEY is not set in .env}"
: "${ADMIN_DOMAIN:?ADMIN_DOMAIN is not set in .env}"
: "${SHOP_DOMAIN:?SHOP_DOMAIN is not set in .env}"

if [[ "$PULL" == 1 ]]; then
  log "Pulling the latest code"
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  git fetch --prune origin
  # Deploys track the remote exactly; local edits on the server are not a
  # state worth preserving, and a half-merged tree is worse than none.
  git reset --hard "origin/${BRANCH}"
  echo "Now at $(git rev-parse --short HEAD) on ${BRANCH}"
fi

if [[ "$TLS" == 1 ]]; then
  log "Issuing or renewing certificates"
  : "${CERTBOT_EMAIL:?CERTBOT_EMAIL is not set in .env}"
  mkdir -p deploy/certbot/conf deploy/certbot/www

  # Certbot needs something answering :80 for the HTTP-01 challenge. If the
  # stack is not up yet, a throwaway Nginx serves the webroot.
  if ! docker compose ps --status running --services 2>/dev/null | grep -qx nginx; then
    docker run --rm -d --name certbot-helper -p 80:80 \
      -v "$REPO_DIR/deploy/certbot/www:/usr/share/nginx/html:ro" nginx:1.27-alpine >/dev/null
    trap 'docker rm -f certbot-helper >/dev/null 2>&1 || true' EXIT
  fi

  docker run --rm \
    -v "$REPO_DIR/deploy/certbot/conf:/etc/letsencrypt" \
    -v "$REPO_DIR/deploy/certbot/www:/var/www/certbot" \
    certbot/certbot:latest certonly --webroot -w /var/www/certbot \
    -d "$ADMIN_DOMAIN" -d "$SHOP_DOMAIN" \
    --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --keep-until-expiring -n

  docker rm -f certbot-helper >/dev/null 2>&1 || true
  trap - EXIT
fi

# certbot writes these as root, and archive/<domain> is 0700, so a plain
# `-f` test fails for the deploying user even when the certificate is there:
# resolving the symlink needs to traverse a directory it cannot enter. `-L`
# checks the link itself, which only needs live/<domain> (0755).
CERT_PATH="deploy/certbot/conf/live/${ADMIN_DOMAIN}/fullchain.pem"
if [[ ! -L "$CERT_PATH" && ! -f "$CERT_PATH" ]]; then
  die "No certificate for ${ADMIN_DOMAIN}. Run: bash deploy/deploy.sh --tls"
fi

log "Building the image"
# npm ci runs inside the build, so the host needs no node_modules.
docker compose build web

log "Starting the stack"
docker compose up -d --remove-orphans

log "Waiting for the app to come up"
for attempt in $(seq 1 30); do
  if [[ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q web)" 2>/dev/null || echo starting)" == "healthy" ]]; then
    echo "Healthy after ${attempt}0s or less."
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    docker compose logs --tail 60 web
    die "The app did not become healthy. Logs above."
  fi
  sleep 10
done

log "Reloading Nginx"
docker compose exec -T nginx nginx -s reload 2>/dev/null || docker compose restart nginx

log "Cleaning up old images"
docker image prune -f --filter "dangling=true" >/dev/null

log "Deployed"
docker compose ps
printf '\nDashboard: https://%s\nStorefront: https://%s\n' "$ADMIN_DOMAIN" "$SHOP_DOMAIN"
