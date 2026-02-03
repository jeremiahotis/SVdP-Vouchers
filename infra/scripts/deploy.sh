#!/usr/bin/env sh
set -e

# Expected flow: pull/build images, run migrations, restart services.

cd "$(dirname "$0")/../docker"

docker compose pull

docker compose up -d --build

docker compose run --rm migrate
