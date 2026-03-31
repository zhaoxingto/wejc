#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--skip-migrate" ]]; then
  python -m alembic upgrade head
fi

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
