# Réplica local do servidor (Ubuntu 24.04 + Nginx + GeoIP2) para testar a configuração antes do VPS.
# Usada por deploy/teste-local/testar.sh — não vai para produção.
FROM ubuntu:24.04

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nginx libnginx-mod-http-geoip2 openssl \
 && rm -rf /var/lib/apt/lists/*

# Certificados autoassinados nos mesmos caminhos que o Let's Encrypt usa no VPS
RUN for d in dccircuitlabs.com portal.dccircuitlabs.com; do \
      mkdir -p /etc/letsencrypt/live/$d && \
      openssl req -x509 -nodes -newkey rsa:2048 -days 2 -subj "/CN=$d" \
        -keyout /etc/letsencrypt/live/$d/privkey.pem -out /etc/letsencrypt/live/$d/fullchain.pem 2>/dev/null; \
    done

# Configuração de produção, sem alterações
COPY nginx/conf.d/ /etc/nginx/conf.d/
COPY nginx/snippets/ /etc/nginx/snippets/
COPY nginx/sites-available/dccircuitlabs.com.conf nginx/sites-available/portal.dccircuitlabs.com.conf /etc/nginx/sites-enabled/
RUN rm -f /etc/nginx/sites-enabled/default

# Só no teste: aceita o IP do visitante pelo cabeçalho X-Forwarded-For, para simular acessos de outros países
COPY teste-local/zz-teste-ip.conf /etc/nginx/conf.d/

COPY geoip/dbip-country-lite.mmdb /var/lib/geoip/dbip-country-lite.mmdb
COPY dist/ /var/www/dccircuitlabs.com/releases/teste/
RUN ln -s /var/www/dccircuitlabs.com/releases/teste /var/www/dccircuitlabs.com/current
COPY portal-em-breve/ /var/www/portal.dccircuitlabs.com/
RUN mkdir -p /var/www/letsencrypt && nginx -t

CMD ["nginx", "-g", "daemon off;"]
