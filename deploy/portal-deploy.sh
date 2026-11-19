#!/usr/bin/env bash
# Publica o Portal do Cliente no VPS. Roda na sua máquina, na raiz do repositório.
#
#   DC_SERVIDOR=deploy@IP DC_SSH="ssh -p 22022" ./deploy/portal-deploy.sh
#
# Envia o código, instala as dependências e compila NO SERVIDOR (o SQLite e o argon2 são módulos nativos),
# aplica as migrações do banco e reinicia o app pelo pm2. O banco e os arquivos (dados/) nunca são tocados.
set -euo pipefail

SERVIDOR="${DC_SERVIDOR:-deploy@dccircuitlabs.com}"
SSH="${DC_SSH:-ssh}"
APP=/srv/apps/portal/app

cd "$(dirname "$0")/.."

echo "==> Enviando o código"
# Ordem importa no rsync: primeiro o que fica de fora, depois o que entra (portal/ e o CSS do site).
rsync -az --delete -e "$SSH" \
  --exclude='/portal/node_modules/' --exclude='/portal/dist/' --exclude='/portal/dados/' --exclude='/portal/.env' \
  --exclude='/portal/.astro/' --exclude='/portal/testes/' \
  --include='/portal/***' --include='/src/' --include='/src/styles/***' --exclude='*' \
  ./ "$SERVIDOR:$APP/"

echo "==> Instalando, compilando, migrando e reiniciando"
# shellcheck disable=SC2087
$SSH "$SERVIDOR" bash -s <<EOF
set -euo pipefail
cd $APP/portal
npm ci --no-audit --no-fund --loglevel=error
npm run build --silent
node --env-file=/srv/apps/portal/.env scripts/migrar.mjs
chmod 600 /srv/apps/portal/dados/portal.db* 2>/dev/null || true   # banco só do deploy (o Nginx lê apenas dados/arquivos/)
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save >/dev/null
EOF

echo "==> Publicado: https://portal.dccircuitlabs.com"
