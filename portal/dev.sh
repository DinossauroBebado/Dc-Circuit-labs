#!/usr/bin/env bash
# Roda comandos do portal dentro de um container com Node 22 (o Astro 7 exige Node 22; a máquina tem Node 20).
#
#   ./dev.sh npm install
#   ./dev.sh npm run dev          → http://localhost:4400
#   ./dev.sh npm test
#   ./dev.sh email                → sobe o Mailpit (caixa de e-mails de teste) em http://localhost:8025
#
# Usa a rede do host, então o portal enxerga o Mailpit em localhost:1025.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(dirname "$AQUI")"

if [[ "${1:-}" == "email" ]]; then
  docker rm -f dc-mailpit >/dev/null 2>&1 || true
  docker run -d --name dc-mailpit --network host axllent/mailpit:v1.27 >/dev/null
  echo "Mailpit: http://localhost:8025 (SMTP em localhost:1025)"
  exit 0
fi

TTY=(); [[ -t 0 && -t 1 ]] && TTY=(-it)
exec docker run --rm "${TTY[@]}" --network host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
  -v "$RAIZ:/repo" -w /repo/portal \
  node:22-bookworm-slim "$@"
