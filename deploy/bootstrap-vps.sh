#!/usr/bin/env bash
# Preparação inicial do VPS Hostinger (Ubuntu 22.04 ou 24.04). Rode UMA vez, como root, com a pasta
# deploy/ copiada para o servidor:
#
#   rsync -av deploy/ root@IP_DO_VPS:/root/dc-deploy/
#   ssh root@IP_DO_VPS 'bash /root/dc-deploy/bootstrap-vps.sh voce@exemplo.com "ssh-ed25519 AAAA... sua-chave"'
#
# Antes: os registros DNS de dccircuitlabs.com, www e portal precisam apontar para o IP do VPS
# (o Let's Encrypt valida pelo DNS). Veja deploy/README.md.
#
# O script é seguro para rodar de novo: cada etapa verifica o que já existe.
set -euo pipefail

EMAIL="${1:?Informe o e-mail para os avisos de vencimento do certificado HTTPS}"
CHAVE_SSH="${2:?Informe a chave SSH pública do usuário de deploy (conteúdo do seu ~/.ssh/id_ed25519.pub)}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
SITE=dccircuitlabs.com
PORTAL=portal.dccircuitlabs.com

[[ $EUID -eq 0 ]] || { echo "Rode como root." >&2; exit 1; }

echo "==> Pacotes"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get install -y nginx libnginx-mod-http-geoip2 certbot ufw unattended-upgrades rsync curl

echo "==> Usuário de deploy (só chave SSH, sem senha)"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
grep -qxF "$CHAVE_SSH" /home/deploy/.ssh/authorized_keys || echo "$CHAVE_SSH" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

echo "==> Pastas"
#   /var/www/dccircuitlabs.com/releases/<versão>  → cada deploy
#   /var/www/dccircuitlabs.com/current            → symlink para a versão no ar
#   /var/www/portal.dccircuitlabs.com             → página "em breve" (depois, estáticos do portal)
#   /srv/apps/<app>                                → futuros backends (o portal do cliente vai em /srv/apps/portal)
install -d -o deploy -g deploy /var/www/$SITE /var/www/$SITE/releases
install -d -o deploy -g deploy /var/www/$PORTAL
install -d /var/www/letsencrypt /srv/apps /var/lib/geoip
if [[ ! -e /var/www/$SITE/current ]]; then
  install -d -o deploy -g deploy /var/www/$SITE/releases/00000000-000000-inicial
  echo '<!doctype html><meta charset="utf-8"><title>DC Circuit Labs</title><p>Em breve.</p>' \
    > /var/www/$SITE/releases/00000000-000000-inicial/index.html
  ln -sfn /var/www/$SITE/releases/00000000-000000-inicial /var/www/$SITE/current
  chown -h deploy:deploy /var/www/$SITE/current
fi
cp "$AQUI"/portal-em-breve/* /var/www/$PORTAL/
chown -R deploy:deploy /var/www/$PORTAL

echo "==> Base GeoIP (idioma por IP) + atualização mensal"
install -m 755 "$AQUI/atualizar-geoip.sh" /usr/local/bin/atualizar-geoip
/usr/local/bin/atualizar-geoip
cat > /etc/systemd/system/atualizar-geoip.service <<'EOF'
[Unit]
Description=Atualiza a base de países por IP usada pelo Nginx
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/atualizar-geoip
EOF
cat > /etc/systemd/system/atualizar-geoip.timer <<'EOF'
[Unit]
Description=Atualização mensal da base GeoIP

[Timer]
OnCalendar=*-*-05 04:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now atualizar-geoip.timer

echo "==> Nginx: arquivos de configuração"
cp "$AQUI"/nginx/conf.d/*.conf /etc/nginx/conf.d/
cp "$AQUI"/nginx/snippets/*.conf /etc/nginx/snippets/
cp "$AQUI"/nginx/sites-available/*.conf /etc/nginx/sites-available/
rm -f /etc/nginx/sites-enabled/default

# Verifica se DNS aponta para este servidor antes de chamar o Let's Encrypt
MEU_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || true)
DNS_SITE=$(dig +short $SITE | tail -n1)

if [[ "$DNS_SITE" == "$MEU_IP" ]]; then
  if [[ ! -d /etc/letsencrypt/live/$SITE || ! -d /etc/letsencrypt/live/$PORTAL ]]; then
    echo "==> HTTPS: emitindo certificados (fase provisória só na porta 80)"
    rm -f /etc/nginx/sites-enabled/*
    ln -sfn /etc/nginx/sites-available/dc-provisorio-http.conf /etc/nginx/sites-enabled/dc-provisorio-http.conf
    nginx -t && systemctl reload nginx
    certbot certonly --webroot -w /var/www/letsencrypt --non-interactive --agree-tos -m "$EMAIL" \
      --cert-name $SITE -d $SITE -d www.$SITE
    certbot certonly --webroot -w /var/www/letsencrypt --non-interactive --agree-tos -m "$EMAIL" \
      --cert-name $PORTAL -d $PORTAL
    rm -f /etc/nginx/sites-enabled/dc-provisorio-http.conf
  fi
else
  echo "==> AVISO: DNS de $SITE ($DNS_SITE) ainda não aponta para este IP ($MEU_IP)."
  echo "    Configurando site provisório HTTP na porta 80 para acesso imediato via IP."
fi

# Renovação automática: o pacote certbot já instala o timer systemd; aqui só recarregamos o Nginx após renovar.
install -d /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/recarregar-nginx.sh <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/recarregar-nginx.sh

echo "==> Nginx: configuração final"
if [[ -d /etc/letsencrypt/live/$SITE && -d /etc/letsencrypt/live/$PORTAL ]]; then
  ln -sfn /etc/nginx/sites-available/$SITE.conf /etc/nginx/sites-enabled/$SITE.conf
  ln -sfn /etc/nginx/sites-available/$PORTAL.conf /etc/nginx/sites-enabled/$PORTAL.conf
  rm -f /etc/nginx/sites-enabled/dc-ip-provisorio.conf
  certbot renew --dry-run
else
  ln -sfn /etc/nginx/sites-available/dc-ip-provisorio.conf /etc/nginx/sites-enabled/dc-ip-provisorio.conf
fi
nginx -t && systemctl reload nginx

echo "==> Firewall: portas SSH, 80 e 443"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 22022/tcp
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Atualizações automáticas de segurança"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "==> SSH: só chave, sem senha"
# Proteção contra ficar trancado para fora: só desliga a senha se o ROOT já tiver chave
# (o usuário deploy não tem sudo — sem chave no root, ninguém mais administraria o servidor).
# Para cadastrar: ssh-copy-id root@IP_DO_VPS (da sua máquina) e rode este script de novo.
if [[ -s /root/.ssh/authorized_keys ]]; then
  cat > /etc/ssh/sshd_config.d/99-dc-somente-chave.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
  sshd -t && (systemctl reload ssh 2>/dev/null || systemctl reload sshd)
else
  echo "!! O root não tem chave SSH — login por senha MANTIDO. Rode ssh-copy-id root@IP_DO_VPS e este script de novo." >&2
fi

cat <<EOF

Pronto.
  • Teste AGORA, em outro terminal, antes de fechar esta sessão:  ssh deploy@$SITE
  • Primeiro deploy, da sua máquina:  ./deploy/deploy.sh
  • Portal: https://$PORTAL (página "em breve")
EOF
