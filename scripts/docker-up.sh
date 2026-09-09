#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

files=(-f compose.yaml)
if [[ "$(uname -s)" == Linux ]]; then
  files+=(-f compose.linux.yaml)
fi

if [[ -f .env.local ]]; then
  exec docker compose "${files[@]}" --env-file .env.local up --build "$@"
fi

exec docker compose "${files[@]}" up --build "$@"
