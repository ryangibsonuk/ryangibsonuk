#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  exec docker compose --env-file .env.local up --build "$@"
fi

exec docker compose up --build "$@"
