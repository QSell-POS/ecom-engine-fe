# Deploying to AWS EC2

The whole app — admin dashboard and storefront — is one Next.js server behind
Nginx, both in Docker. Two domains, one container.

## Once per instance

Launch **t3.small or larger** (a `next build` needs ~2 GB; t3.micro will OOM),
Amazon Linux 2023 or Ubuntu 24.04, 20 GB disk. In its security group open
**22** (your IP only), **80** and **443** (anywhere). Attach an Elastic IP, or
the address changes on every stop/start and takes DNS with it.

Point both domains' **A records** at that IP before asking for certificates —
Let's Encrypt validates over HTTP, so DNS has to resolve first.

### 1. Connect

From Windows `cmd` (OpenSSH ships with Windows 10/11, no PuTTY needed). SSH
refuses a key that other accounts can read, so lock the `.pem` down first:

```bat
icacls "%USERPROFILE%\Downloads\ecom-key.pem" /inheritance:r
icacls "%USERPROFILE%\Downloads\ecom-key.pem" /grant:r "%USERNAME%":R

ssh -i "%USERPROFILE%\Downloads\ecom-key.pem" ec2-user@<ELASTIC-IP>
```

`ec2-user` on Amazon Linux, `ubuntu` on Ubuntu.

### 2. Deploy key

The repo is private, so the instance needs its own read-only key. Install git,
then let the bootstrap script mint the keypair:

```bash
sudo dnf -y install git          # Amazon Linux
# sudo apt-get update -y && sudo apt-get install -y git   # Ubuntu

curl -fsSL -o bootstrap-ec2.sh   "https://raw.githubusercontent.com/QSell-POS/ecom-engine-fe/main/deploy/bootstrap-ec2.sh"
```

That `curl` needs the repo to be public. For a private repo, paste the script
in by hand instead (`nano bootstrap-ec2.sh`), or generate the key directly:

```bash
ssh-keygen -t ed25519 -N "" -C "ecom-engine-fe deploy" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```

Copy that single line into **GitHub → the repo → Settings → Deploy keys → Add
deploy key**. Title it after the instance. Leave **Allow write access
unchecked** — deploys only read.

Then verify and clone:

```bash
ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> ~/.ssh/known_hosts
ssh -T git@github.com            # "successfully authenticated" is the pass
git clone git@github.com:QSell-POS/ecom-engine-fe.git ~/ecom-engine-fe
```

A deploy key is scoped to one repo, so it cannot reach anything else in the
org if the instance is compromised — which is why this is not a personal
access token or an account SSH key.

### 3. Bootstrap

```bash
cd ~/ecom-engine-fe && bash deploy/bootstrap-ec2.sh
```

Installs Docker and compose v2, pins GitHub's host key, copies `.env` from the
template, installs a systemd unit so the stack returns after a reboot, and
adds a weekly cron for certificate renewal. Re-running it is safe.

### 4. Environment file

Two ways. On the instance:

```bash
nano ~/ecom-engine-fe/.env
```

Or write it locally and copy it up — from Windows `cmd`, in the directory
holding the file:

```bat
scp -i "%USERPROFILE%\Downloads\ecom-key.pem" .env.production ec2-user@<ELASTIC-IP>:~/ecom-engine-fe/.env
```

Do **not** copy your development `.env` as-is: its `API_URL` points at
localhost and its `API_KEY` is a dev key.

### 5. Go live

```bash
newgrp docker                    # so docker needs no sudo, this session
cd ~/ecom-engine-fe
bash deploy/deploy.sh --tls
```

`--tls` is only needed the first time; the cron handles renewals.

### Chicken and egg: the API key

`.env` wants an `API_KEY`, which is minted *in* the dashboard. Order that
works: put a placeholder in `API_KEY`, run `deploy.sh --tls`, open
`https://admin.yourdomain.com/register`, create the store, go to **API keys →
New key**, copy it (shown once), then:

```bash
nano .env                        # paste the real key
bash deploy/deploy.sh --no-pull
```

## Where the image is built

**On GitHub, not on the instance.** A Next.js build needs ~2 GB, which is all
a t3.small has, so building on the box swaps it to death. Pushing to
`production` triggers [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml),
which builds and publishes to GHCR:

```
ghcr.io/qsell-pos/ecom-engine-fe:production
ghcr.io/qsell-pos/ecom-engine-fe:<commit sha>
```

The instance only pulls. A deploy is a download, not a compile.

### One-time GHCR setup

The repo is private, so the package is too, and the instance needs a token to
pull it.

1. **GitHub → Settings → Developer settings → Personal access tokens →
   Tokens (classic) → Generate new token.** Scope: **`read:packages` only.**
   Nothing else — this token sits on a server.
2. Put it in `.env` on the instance:
   ```ini
   GHCR_USER=your-github-username
   GHCR_TOKEN=ghp_...
   ```
3. **Settings → Secrets and variables → Actions → Variables** on the repo, add
   the browser-visible values the image is compiled with:
   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://api.abhishekpun.com.np` |
   | `NEXT_PUBLIC_DEFAULT_CURRENCY` | `NPR` |

   These end up in the JavaScript sent to browsers, so they are variables, not
   secrets. Changing one needs a new image, which the next push produces.

## Every deploy after that

Push to `production`, wait for the Actions run (2–4 minutes, mostly cached),
then on the instance:

```bash
cd ~/ecom-engine-fe && bash deploy/deploy.sh
```

Pull code → log in to GHCR → pull image → run → health-check → reload Nginx →
prune. Usually under a minute. Re-running it is safe.

| Flag | Effect |
| --- | --- |
| *(none)* | Pull the published image and redeploy |
| `--no-pull` | Skip the git reset — use after editing `.env` |
| `--build` | Build on this host instead of pulling (needs ~2 GB free) |
| `--tls` | Also issue or renew certificates |

### Rolling back

Every build is tagged with its commit SHA, so a rollback is one line in `.env`
and no rebuild at all:

```ini
WEB_IMAGE=ghcr.io/qsell-pos/ecom-engine-fe:9fc0b34...
```

```bash
bash deploy/deploy.sh --no-pull
```

Comment the line out again to return to the latest `production` build.

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

Rolling back is the `WEB_IMAGE` pin described above — no checkout, no rebuild.

## SSH to GitHub is blocked

If the deploy key is registered but `ssh -T git@github.com` times out, the
instance cannot open port 22 outbound — a restricted egress rule on the
security group, or a corporate network in front of it. GitHub serves SSH on
443 as well, which almost always gets through:

```bash
cat >> ~/.ssh/config <<'CONF'
Host github.com
  Hostname ssh.github.com
  Port 443
  User git
CONF
chmod 600 ~/.ssh/config

ssh-keyscan -p 443 ssh.github.com >> ~/.ssh/known_hosts
ssh -T git@github.com
```

Everything else — the clone, `deploy.sh`, the renewal cron — picks this up
automatically, because it is the same `github.com` host alias.

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
- **`Could not pull the image`** — either the Actions run has not finished
  (check the repo's Actions tab) or `GHCR_USER`/`GHCR_TOKEN` are wrong. Test
  by hand: `docker login ghcr.io -u <user>` then
  `docker pull ghcr.io/qsell-pos/ecom-engine-fe:production`.
- **Build killed, or the box freezes during `--build`** — that is the memory
  ceiling this setup exists to avoid. Do not build on the instance; let the
  workflow do it. If you must, add swap first:
  ```bash
  sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

## A note on `GET /tenant` and `PATCH /tenant/:id/status`

Those routes are unauthenticated on the backend: anyone can list every tenant
or deactivate one. Nothing in this frontend calls them, and nothing should
until the backend fixes them. They are worth blocking at the API's own proxy
in the meantime.
