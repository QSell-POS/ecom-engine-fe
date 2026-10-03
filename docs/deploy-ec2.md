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
