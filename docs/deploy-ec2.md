# Deploying to AWS EC2

The whole app — admin dashboard and storefront — is one Next.js server behind
Nginx, both in Docker. Two domains, one container.

## Once per instance

Launch **t3.small or larger** (a `next build` needs ~2 GB; t3.micro will OOM),
Amazon Linux 2023 or Ubuntu 24.04, 20 GB disk. In its security group open
**22** (your IP only), **80** and **443** (anywhere).

Point both domains' **A records** at the instance's public IP before asking for
certificates — Let's Encrypt validates over HTTP, so DNS has to resolve first.

SSH in and run:

```bash
curl -fsSL https://raw.githubusercontent.com/QSell-POS/ecom-engine-fe/main/deploy/bootstrap-ec2.sh | bash
```

That installs Docker and compose v2, clones the repo to `~/ecom-engine-fe`,
copies `.env`, installs a systemd unit so the stack comes back after a reboot,
and adds a weekly cron for certificate renewal.

Then:

```bash
nano ~/ecom-engine-fe/.env     # fill in the five required values
newgrp docker                  # so docker works without sudo
cd ~/ecom-engine-fe && bash deploy/deploy.sh --tls
```

`--tls` is only needed the first time; the cron handles renewals.

## Every deploy after that

```bash
cd ~/ecom-engine-fe && bash deploy/deploy.sh
```

One command: pull → build → run → health-check → reload Nginx → prune.
It pulls the current branch, resets to `origin/<branch>`, builds the image
(`npm ci` happens inside the build, so the host never installs anything),
starts the stack, waits for the container's health check, reloads Nginx and
removes dangling images. Re-running it is safe.

| Flag | Effect |
| --- | --- |
| *(none)* | Pull and redeploy |
| `--no-pull` | Rebuild what is checked out — use after editing `.env` |
| `--tls` | Also issue or renew certificates |

## Configuration

`.env` lives in the repo root on the instance, copied from
`deploy/.env.example`. Five values are required:

| Variable | What it is |
| --- | --- |
| `API_URL` | The backend base URL, no trailing slash |
| `API_KEY` | A storefront key from the dashboard (**API keys → New key**) |
| `ADMIN_DOMAIN` | Where the dashboard is served |
| `SHOP_DOMAIN` | Where the storefront is served |
| `CERTBOT_EMAIL` | For Let's Encrypt expiry warnings |

`API_URL` and `API_KEY` are read per request, so changing them needs only a
redeploy, never a code change. Anything starting with `NEXT_PUBLIC_` is
compiled into the browser bundle, so it is a **build arg** — `deploy.sh`
rebuilds every time, so editing it and re-running is enough.

The API key is tenant-scoped: this deployment serves the catalog of whichever
tenant minted the key.

## What the backend needs set

On the API's own `.env` (on its EC2 box), then `bash deploy/deploy.sh` there:

```ini
CORS_ORIGINS=https://admin.yourdomain.com,https://shop.yourdomain.com
FRONTEND_URL=https://admin.yourdomain.com
ESEWA_REDIRECT_URL=https://shop.yourdomain.com/payment-result
KHALTI_WEBSITE_URL=https://shop.yourdomain.com
```

`FRONTEND_URL` must be the **dashboard** domain: after Meta OAuth the API
redirects to `FRONTEND_URL/integrations`, which is a dashboard page.

## Operating it

```bash
cd ~/ecom-engine-fe

docker compose ps                      # what is running
docker compose logs -f web             # app logs
docker compose logs -f nginx           # proxy logs
docker compose restart web             # restart just the app
docker compose down                    # stop everything
sudo systemctl status ecom-engine-fe   # the boot unit
```

Rolling back is a checkout plus a rebuild:

```bash
git log --oneline -10
git checkout <sha>
bash deploy/deploy.sh --no-pull
```

(`deploy.sh` without `--no-pull` would reset you back to the branch head.)

## When it does not come up

- **`deploy.sh` says the app never became healthy** — it prints the last 60
  log lines. A bad `API_URL` or `API_KEY` does *not* stop the container: the
  health check only loads `/login`, which renders without the backend. So
  this is usually a build or boot failure, not a credentials problem.
- **502 from Nginx** — the app container is down or unhealthy;
  `docker compose logs web`.
- **Browser shows "Can't reach the API server"** — that message comes from
  this app's own client, so the server is fine and `API_URL` is wrong or the
  API's security group does not admit this instance.
- **401s everywhere after signing in** — `API_KEY` is revoked or belongs to
  another tenant. Mint a new one in the dashboard.
- **Certbot fails** — DNS is not pointing here yet, or port 80 is closed.
  Check with `dig +short $ADMIN_DOMAIN`.
- **Build killed** — the instance is too small. t3.small minimum.

## A note on `GET /tenant` and `PATCH /tenant/:id/status`

Those routes are unauthenticated on the backend: anyone can list every tenant
or deactivate one. Nothing in this frontend calls them, and nothing should
until the backend fixes them. They are worth blocking at the API's own proxy
in the meantime.
