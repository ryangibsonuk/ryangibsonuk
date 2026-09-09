#!/bin/sh
set -eu

DATA_DIR="${HQ_DATA_DIR:-/var/lib/hq}"
mkdir -p "$DATA_DIR"

if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs "$DATA_DIR"
  exec setpriv --reuid=nextjs --regid=nodejs --init-groups -- "$@"
fi

exec "$@"
