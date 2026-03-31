#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_USER="${SUDO_USER:-$(whoami)}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
VENV_DIR="${VENV_DIR:-$ROOT_DIR/.venv}"
USE_SUDO="${USE_SUDO:-auto}"

run_root() {
  if [[ "$USE_SUDO" == "never" ]]; then
    "$@"
    return
  fi

  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

prompt_if_empty() {
  local current_value="$1"
  local prompt_text="$2"
  local secret="${3:-false}"
  local result="$current_value"

  if [[ -n "$result" ]]; then
    printf '%s' "$result"
    return
  fi

  if [[ "$secret" == "true" ]]; then
    read -r -s -p "$prompt_text: " result
    echo
  else
    read -r -p "$prompt_text: " result
  fi

  printf '%s' "$result"
}

ensure_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    echo "Using existing env file: $ENV_FILE"
    return
  fi

  echo "No .env found. Creating one from interactive prompts."
  local database_url redis_url secret_key app_port log_level erp_timeout worker_poll_seconds app_admin_password

  database_url="$(prompt_if_empty "" "DATABASE_URL (example: postgresql+psycopg://postgres:password@127.0.0.1:5432/channel_platform)")"
  redis_url="$(prompt_if_empty "redis://127.0.0.1:6379/0" "REDIS_URL")"
  secret_key="$(prompt_if_empty "" "SECRET_KEY" true)"
  app_port="$(prompt_if_empty "8000" "APP_PORT")"
  log_level="$(prompt_if_empty "INFO" "LOG_LEVEL")"
  erp_timeout="$(prompt_if_empty "10" "ERP_TIMEOUT")"
  worker_poll_seconds="$(prompt_if_empty "30" "WORKER_POLL_SECONDS")"
  app_admin_password="$(prompt_if_empty "" "APP_ADMIN_PASSWORD placeholder (optional, not used by current backend)" true)"

  cat > "$ENV_FILE" <<EOF
APP_NAME=Channel Commerce Platform
APP_ENV=production
APP_DEBUG=false
APP_HOST=0.0.0.0
APP_PORT=$app_port
DATABASE_URL=$database_url
REDIS_URL=$redis_url
SECRET_KEY=$secret_key
LOG_LEVEL=$log_level
ERP_TIMEOUT=$erp_timeout
WORKER_POLL_SECONDS=$worker_poll_seconds
APP_ADMIN_PASSWORD=$app_admin_password
EOF

  echo "Created $ENV_FILE"
  echo "Review it after deploy if needed."
}

ensure_venv() {
  if [[ ! -d "$VENV_DIR" ]]; then
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  fi

  # shellcheck source=/dev/null
  source "$VENV_DIR/bin/activate"
  python -m pip install --upgrade pip
  pip install -e .
}

install_systemd_units() {
  local api_target="/etc/systemd/system/channel-platform-api.service"
  local worker_target="/etc/systemd/system/channel-platform-worker.service"
  sed "s|__APP_DIR__|$ROOT_DIR|g; s|__APP_USER__|$APP_USER|g" \
    "$ROOT_DIR/deploy/systemd/channel-platform-api.service.template" > /tmp/channel-platform-api.service
  sed "s|__APP_DIR__|$ROOT_DIR|g; s|__APP_USER__|$APP_USER|g" \
    "$ROOT_DIR/deploy/systemd/channel-platform-worker.service.template" > /tmp/channel-platform-worker.service

  run_root mv /tmp/channel-platform-api.service "$api_target"
  run_root mv /tmp/channel-platform-worker.service "$worker_target"
  run_root systemctl daemon-reload
  run_root systemctl enable channel-platform-api
  run_root systemctl enable channel-platform-worker
  run_root systemctl restart channel-platform-api
  run_root systemctl restart channel-platform-worker
}

main() {
  echo "Deploy root: $ROOT_DIR"
  echo "App user: $APP_USER"

  ensure_env_file
  ensure_venv

  # shellcheck source=/dev/null
  source "$VENV_DIR/bin/activate"
  python -m alembic upgrade head
  python -m pytest -q

  if command -v systemctl >/dev/null 2>&1; then
    install_systemd_units
    echo "Systemd services installed and restarted."
  else
    echo "systemctl not found; skipped service installation."
    echo "Start API manually: source $VENV_DIR/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
    echo "Start worker manually: source $VENV_DIR/bin/activate && python -m app.tasks.order_push_worker"
  fi

  echo "Deploy completed."
  echo "Nginx example: $ROOT_DIR/deploy/nginx/channel-platform.conf.example"
}

main "$@"
