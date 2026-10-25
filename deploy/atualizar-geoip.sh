#!/usr/bin/env bash
# Baixa a base gratuita de países por IP (DB-IP "IP to Country Lite", CC BY 4.0) usada pelo Nginx
# para escolher o idioma do site. No VPS roda todo mês pelo timer systemd `atualizar-geoip.timer`.
#
# Uso: atualizar-geoip [arquivo-de-destino]   (padrão: /var/lib/geoip/dbip-country-lite.mmdb)
set -euo pipefail

DESTINO="${1:-/var/lib/geoip/dbip-country-lite.mmdb}"
TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT

mkdir -p "$(dirname "$DESTINO")"
for MES in "$(date +%Y-%m)" "$(date -d '-1 month' +%Y-%m)"; do
  if curl -fsSL "https://download.db-ip.com/free/dbip-country-lite-$MES.mmdb.gz" -o "$TEMP/base.mmdb.gz"; then
    gunzip -c "$TEMP/base.mmdb.gz" > "$TEMP/base.mmdb"
    install -m 644 "$TEMP/base.mmdb" "$DESTINO"
    echo "Base GeoIP atualizada ($MES) em $DESTINO"
    exit 0
  fi
done

echo "Não foi possível baixar a base GeoIP — o Nginx segue usando a versão anterior." >&2
exit 1
