#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker_bin=(docker)
if ! docker info >/dev/null 2>&1; then
  docker_bin=(sudo docker)
fi

files=(-f compose.yaml)
if [[ "$(uname -s)" == Linux ]]; then
  files+=(-f compose.linux.yaml)
fi

if [[ -f .env.local ]]; then
  exec "${docker_bin[@]}" compose "${files[@]}" --env-file .env.local up --build "$@"
fi

exec "${docker_bin[@]}" compose "${files[@]}" up --build "$@"
