# Deployment Guide

## Recommended Mode

Use GitHub for version control, then deploy manually on the server:

1. `git pull`
2. run one deploy script
3. script installs dependencies, runs migrations, runs tests, and restarts services

Primary script:

```bash
chmod +x scripts/deploy_manual.sh
./scripts/deploy_manual.sh
```

## Files You Need

- Production env template: `deploy/env.production.example`
- API service template: `deploy/systemd/channel-platform-api.service.template`
- Worker service template: `deploy/systemd/channel-platform-worker.service.template`
- Nginx example: `deploy/nginx/channel-platform.conf.example`

## Required Settings To Fill

These are required for the current backend:

- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `APP_PORT`
- `LOG_LEVEL`
- `ERP_TIMEOUT`
- `WORKER_POLL_SECONDS`

## Reserved Placeholder Settings

This project does **not** currently implement admin login.

`APP_ADMIN_PASSWORD` is included only as a future placeholder so you know where to put it later if an admin module is added.

## First Server Deploy

```bash
git clone <your-repo-url>
cd wejc
cp deploy/env.production.example .env
# edit .env manually, or let scripts/deploy_manual.sh prompt for values
chmod +x scripts/deploy_manual.sh
./scripts/deploy_manual.sh
```

## What The Deploy Script Does

- creates `.venv` if missing
- installs dependencies
- creates `.env` interactively if missing
- runs `alembic upgrade head`
- runs `python -m pytest -q`
- installs and restarts `systemd` services if `systemctl` is available

## Verification

After deploy, verify:

1. `GET /health` returns `code=0`
2. `POST /api/store/resolve` returns a valid `store_context_token`
3. `POST /api/customer/orders` creates `order_push_task`
4. worker updates push status or retries it
5. `order_push_log` records push results

## Local Demo

To boot the backend with a usable admin page locally:

```bash
cd admin-web && npm install && npm run build
cd ..
python -m alembic upgrade head
python scripts/seed_demo_data.py
python -m uvicorn app.main:app --reload
```

Then open:

- `http://127.0.0.1:8000/admin`

Use shop code:

- `SHP8A92KD`

Platform admin login:

- username: `admin`
- password: `admin123456`
