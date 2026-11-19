#!/usr/bin/env bash
# Prepara o VPS para o Portal do Cliente. Rode UMA vez, como root (o site já precisa estar configurado
# pelo bootstrap-vps.sh). Seguro para rodar de novo.
#
#   rsync -av -e "ssh -p 22022" deploy/ root@IP_DO_VPS:/root/dc-deploy/
#   ssh -p 22022 root@IP_DO_VPS 'bash /root/dc-deploy/portal-bootstrap.sh'
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
BASE=/srv/apps/portal
[[ $EUID -eq 0 ]] || { echo "Rode como root." >&2; exit 1; }

echo "==> Node 22 LTS (NodeSource) e pm2"
if ! node -v 2>/dev/null | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y build-essential python3 sqlite3 rsync   # módulos nativos (SQLite, argon2) e backups
command -v pm2 >/dev/null || npm install -g pm2@6

echo "==> Pastas (do usuário deploy)"
install -d -o deploy -g deploy "$BASE" "$BASE/app" "$BASE/logs"
install -d -o deploy -g deploy -m 700 "$BASE/backups"
# O Nginx (www-data) entrega os arquivos protegidos (X-Accel-Redirect): atravessa dados/ sem listar (710)
# e lê só dados/arquivos/. O banco fica 600 (só o deploy) — o portal-deploy.sh garante.
install -d -o deploy -g www-data -m 710 "$BASE/dados"
install -d -o deploy -g www-data -m 750 "$BASE/dados/arquivos"
if [[ ! -f "$BASE/.env" ]]; then
  cat > "$BASE/.env" <<'EOF'
PORTAL_URL=https://portal.dccircuitlabs.com
DB_ARQUIVO=/srv/apps/portal/dados/portal.db
ARQUIVOS_DIR=/srv/apps/portal/dados/arquivos
SMTP_HOST=smtp.titan.email
SMTP_PORTA=465
SMTP_SEGURO=true
SMTP_USUARIO=portal@dccircuitlabs.com
SMTP_SENHA=
EMAIL_REMETENTE="DC Circuit Labs <portal@dccircuitlabs.com>"
# O Nginx entrega os arquivos (vídeos, GLB) depois que o portal confere a permissão
ARQUIVOS_X_ACCEL=true
# Confluence: e-mail da conta Atlassian + token (id.atlassian.com > Segurança > Tokens de API)
CONFLUENCE_URL=https://dccircuitlabs.atlassian.net/wiki
CONFLUENCE_ESPACO=PORTAL
CONFLUENCE_EMAIL=
CONFLUENCE_TOKEN=
# Bling: desligado (notas fiscais enviadas à mão no painel). Para ligar: BLING_ATIVO=true + app de integração (developer.bling.com.br), redirecionamento https://portal.dccircuitlabs.com/admin/bling/retorno
BLING_CLIENT_ID=
BLING_CLIENT_SECRET=
EOF
  chown deploy:deploy "$BASE/.env"
  chmod 600 "$BASE/.env"
  echo "   Criado $BASE/.env — preencha SMTP_SENHA, CONFLUENCE_EMAIL/TOKEN e BLING_CLIENT_ID/SECRET."
fi

echo "==> pm2 sobe sozinho quando o VPS reinicia"
pm2 startup systemd -u deploy --hp /home/deploy >/dev/null

echo "==> Backup diário (4h) do banco e dos arquivos, 14 dias"
install -m 755 "$AQUI"/portal-backup.sh /usr/local/bin/portal-backup
cat > /etc/systemd/system/portal-backup.service <<'UNIDADE'
[Unit]
Description=Backup do Portal do Cliente

[Service]
Type=oneshot
User=deploy
ExecStart=/usr/local/bin/portal-backup
UNIDADE
cat > /etc/systemd/system/portal-backup.timer <<'UNIDADE'
[Unit]
Description=Backup diário do Portal do Cliente

[Timer]
OnCalendar=*-*-* 04:00:00
Persistent=true

[Install]
WantedBy=timers.target
UNIDADE
systemctl daemon-reload
systemctl enable --now portal-backup.timer

echo "==> Nginx do portal"
cp "$AQUI"/nginx/conf.d/dc-portal.conf /etc/nginx/conf.d/
cp "$AQUI"/nginx/snippets/dc-portal-proxy.conf /etc/nginx/snippets/
cp "$AQUI"/nginx/sites-available/portal.dccircuitlabs.com.conf /etc/nginx/sites-available/
cp "$AQUI"/portal-em-breve/manutencao.html /var/www/portal.dccircuitlabs.com/
nginx -t && systemctl reload nginx

echo "Pronto. Agora, da sua máquina: ./deploy/portal-deploy.sh"
