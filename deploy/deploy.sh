#!/usr/bin/env bash
# Publica o site no VPS. Roda na sua máquina, na raiz do repositório.
#
#   ./deploy/deploy.sh            gera o build, envia para uma pasta nova no servidor e troca o site para ela
#   ./deploy/deploy.sh --voltar   volta para a versão publicada antes da atual
#
# Cada deploy fica em /var/www/dccircuitlabs.com/releases/<data-hora>; o Nginx serve o symlink `current`.
# A troca é instantânea e as 5 últimas versões ficam guardadas para voltar.
set -euo pipefail

SERVIDOR="${DC_SERVIDOR:-deploy@dccircuitlabs.com}"
SSH="${DC_SSH:-ssh}"   # ex.: DC_SSH="ssh -p 2222 -i ~/.ssh/outra_chave"
BASE=/var/www/dccircuitlabs.com
MANTER=5

# Nos blocos enviados por SSH abaixo, $BASE, $VERSAO e $MANTER são expandidos aqui (de propósito);
# as variáveis do servidor aparecem escapadas (\$ATUAL).
# shellcheck disable=SC2087

cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--voltar" ]]; then
  $SSH "$SERVIDOR" bash -s <<EOF
set -euo pipefail
cd $BASE/releases
ATUAL=\$(basename "\$(readlink -f $BASE/current)")
ANTERIOR=\$(ls -1 | sort | grep -B1 -x "\$ATUAL" | head -n 1)
if [[ -z "\$ANTERIOR" || "\$ANTERIOR" == "\$ATUAL" ]]; then echo "Não há versão anterior a \$ATUAL." >&2; exit 1; fi
ln -sfn $BASE/releases/\$ANTERIOR $BASE/current.novo && mv -Tf $BASE/current.novo $BASE/current
echo "Site voltou para \$ANTERIOR (era \$ATUAL)."
EOF
  exit 0
fi

# Cases e apoios sem autorização por escrito nunca vão para produção.
if [[ "${INCLUIR_NAO_AUTORIZADOS:-}" == "true" ]] || grep -qs '^INCLUIR_NAO_AUTORIZADOS=true' .env; then
  echo "INCLUIR_NAO_AUTORIZADOS=true está ativo — isso publicaria cases sem autorização. Deploy cancelado." >&2
  exit 1
fi

npm ci
npm run build

VERSAO="$(date +%Y%m%d-%H%M%S)"
echo "==> Enviando versão $VERSAO"
rsync -az --delete -e "$SSH" dist/ "$SERVIDOR:$BASE/releases/$VERSAO/"

$SSH "$SERVIDOR" bash -s <<EOF
set -euo pipefail
ln -sfn $BASE/releases/$VERSAO $BASE/current.novo
mv -Tf $BASE/current.novo $BASE/current
cd $BASE/releases && ls -1 | sort | head -n -$MANTER | xargs -r rm -rf
EOF

echo "==> Publicado: https://dccircuitlabs.com (versão $VERSAO)"
