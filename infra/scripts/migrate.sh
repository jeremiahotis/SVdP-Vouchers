#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/../docker"

docker compose run --rm migrate
