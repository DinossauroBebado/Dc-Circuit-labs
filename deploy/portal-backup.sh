#!/usr/bin/env bash
# Backup diário do Portal do Cliente (instalado pelo portal-bootstrap.sh como timer do systemd, roda como deploy).
#  - banco: cópia consistente (sqlite .backup), comprimida, uma por dia;
#  - arquivos: "foto" do dia com hard links (só o que é novo ocupa espaço; os arquivos nunca mudam de conteúdo).
# Guarda 14 dias. Fica no mesmo disco: protege de apagar/estragar por engano, não de perder o VPS —
# para isso, mantenha também o snapshot/backup da Hostinger ligado.
set -euo pipefail
BASE=/srv/apps/portal
DESTINO="$BASE/backups"
DIA="$(date +%F)"
umask 077
mkdir -p "$DESTINO/banco" "$DESTINO/arquivos"

sqlite3 "$BASE/dados/portal.db" ".backup '$DESTINO/banco/portal-$DIA.db'"
gzip -f "$DESTINO/banco/portal-$DIA.db"

ULTIMO="$(ls -1d "$DESTINO"/arquivos/*/ 2>/dev/null | grep -v "/$DIA/$" | tail -n 1 || true)"
rsync -a --delete ${ULTIMO:+--link-dest="$ULTIMO"} "$BASE/dados/arquivos/" "$DESTINO/arquivos/$DIA/"

find "$DESTINO/banco" -name 'portal-*.db.gz' -mtime +14 -delete
find "$DESTINO/arquivos" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
echo "Backup $DIA ok: $(du -sh "$DESTINO" | cut -f1) no total"
