#!/usr/bin/env bash
# Sobe uma cópia do servidor em Docker (mesma configuração do Nginx do VPS) e confere:
# idioma por IP, cookie de idioma, robôs sem redirecionamento, HTTPS, www, portal, arquivos de SEO.
#
# Uso (na raiz do repositório):  ./deploy/teste-local/testar.sh
# Requer Docker. Usa o build atual em dist/ (rode `npm run build` antes).
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
TESTE="$RAIZ/deploy/teste-local"
IMAGEM=dc-nginx-teste
PORTA=8443
PORTA_HTTP=8080

[[ -f "$RAIZ/dist/index.html" ]] || { echo "Rode npm run build antes." >&2; exit 1; }

if [[ ! -f "$TESTE/geoip/dbip-country-lite.mmdb" ]]; then
  bash "$RAIZ/deploy/atualizar-geoip.sh" "$TESTE/geoip/dbip-country-lite.mmdb" || exit 1
fi

# Contexto mínimo para o Docker (sem node_modules nem as pastas de clientes)
CONTEXTO="$(mktemp -d)"
trap 'rm -rf "$CONTEXTO"; docker rm -f $IMAGEM >/dev/null 2>&1' EXIT
cp -r "$RAIZ/deploy/nginx" "$RAIZ/deploy/portal-em-breve" "$RAIZ/dist" "$CONTEXTO/"
mkdir -p "$CONTEXTO/teste-local" "$CONTEXTO/geoip"
cp "$TESTE/zz-teste-ip.conf" "$CONTEXTO/teste-local/"
cp "$TESTE/geoip/dbip-country-lite.mmdb" "$CONTEXTO/geoip/"

docker build -q -t $IMAGEM -f "$TESTE/Dockerfile" "$CONTEXTO" >/dev/null || { echo "Falha no build da imagem (nginx -t?)" >&2; exit 1; }
docker rm -f $IMAGEM >/dev/null 2>&1
docker run -d --name $IMAGEM -p $PORTA:443 -p $PORTA_HTTP:80 $IMAGEM >/dev/null
sleep 1

OK=0; FALHAS=0
pedir() { # pedir HOST CAMINHO [args curl...] → "código local"
  local host=$1 caminho=$2; shift 2
  curl -sk -o /dev/null -w '%{http_code} %{redirect_url}' --resolve "$host:$PORTA:127.0.0.1" "https://$host:$PORTA$caminho" "$@"
}
conferir() { # conferir "descrição" "esperado" "obtido" — o esperado aceita curingas (*)
  # shellcheck disable=SC2053
  if [[ "${3,,}" == ${2,,} ]]; then echo "  ok     $1"; OK=$((OK + 1)); else echo "  FALHOU $1 — esperado '$2', veio '$3'"; FALHAS=$((FALHAS + 1)); fi
}

BR=200.160.2.3        # registro.br
EUA=8.8.8.8
CHINA=114.114.114.114
TAIWAN=168.95.1.1
PORTUGAL=193.136.0.1
NAVEGADOR='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

echo "Idioma por IP"
conferir "Brasil fica em português"            "200 "                                 "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $BR" -A "$NAVEGADOR")"
conferir "Portugal fica em português"          "200 "                                 "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $PORTUGAL" -A "$NAVEGADOR")"
conferir "EUA vai para /en/"                   "302 https://dccircuitlabs.com*/en/"   "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $EUA" -A "$NAVEGADOR")"
conferir "China vai para /zh/ (mesma página)"  "302 *dccircuitlabs.com*/zh/servicos/firmware/" "$(pedir dccircuitlabs.com /servicos/firmware/ -H "X-Forwarded-For: $CHINA" -A "$NAVEGADOR")"
conferir "Taiwan vai para /zh/"                "302 *dccircuitlabs.com*/zh/"          "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $TAIWAN" -A "$NAVEGADOR")"
conferir "Query string é mantida"              "302 *dccircuitlabs.com*/en/?utm_source=instagram" "$(pedir dccircuitlabs.com '/?utm_source=instagram' -H "X-Forwarded-For: $EUA" -A "$NAVEGADOR")"
conferir "/en/ não é redirecionado"            "200 "                                 "$(pedir dccircuitlabs.com /en/ -H "X-Forwarded-For: $BR" -A "$NAVEGADOR")"
conferir "Arquivos não são redirecionados"     "200 "                                 "$(pedir dccircuitlabs.com /robots.txt -H "X-Forwarded-For: $EUA" -A "$NAVEGADOR")"

echo "Escolha manual vale mais que o IP"
conferir "Cookie lang=pt nos EUA fica em PT"   "200 "                                 "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $EUA" -A "$NAVEGADOR" -b 'lang=pt')"
conferir "?lang=pt redireciona para URL limpa" "302 *dccircuitlabs.com*/sobre/"       "$(pedir dccircuitlabs.com '/sobre/?lang=pt' -H "X-Forwarded-For: $EUA" -A "$NAVEGADOR")"
COOKIE=$(curl -sk -D - -o /dev/null --resolve "dccircuitlabs.com:$PORTA:127.0.0.1" "https://dccircuitlabs.com:$PORTA/sobre/?lang=pt" -H "X-Forwarded-For: $EUA" | grep -i '^set-cookie' | tr -d '\r')
conferir "?lang=pt grava o cookie"             "*lang=pt*"                            "$COOKIE"

echo "Robôs nunca são redirecionados"
conferir "Googlebot nos EUA vê PT"             "200 "  "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $EUA" -A 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')"
conferir "GPTBot vê PT"                        "200 "  "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $EUA" -A 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)')"
conferir "ClaudeBot vê PT"                     "200 "  "$(pedir dccircuitlabs.com / -H "X-Forwarded-For: $CHINA" -A 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)')"

echo "Domínios e HTTPS"
conferir "HTTP → HTTPS"                        "301 https://dccircuitlabs.com/*"      "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --resolve "dccircuitlabs.com:$PORTA_HTTP:127.0.0.1" "http://dccircuitlabs.com:$PORTA_HTTP/")"
conferir "www → domínio principal"             "301 https://dccircuitlabs.com/*"      "$(pedir www.dccircuitlabs.com /)"
conferir "Portal responde"                     "200 "                                 "$(pedir portal.dccircuitlabs.com /)"
PORTAL=$(curl -sk --resolve "portal.dccircuitlabs.com:$PORTA:127.0.0.1" "https://portal.dccircuitlabs.com:$PORTA/")
conferir "Portal mostra 'Em breve'"            "*Em breve*"                           "$PORTAL"
conferir "Portal fora do Google (noindex)"     "*noindex*"                            "$(curl -skI --resolve "portal.dccircuitlabs.com:$PORTA:127.0.0.1" "https://portal.dccircuitlabs.com:$PORTA/" | grep -i x-robots-tag)"

echo "SEO, IA e segurança"
for arq in /robots.txt /llms.txt /sitemap.xml /favicon.ico /models/placa-metabee.glb; do
  conferir "$arq" "200 " "$(pedir dccircuitlabs.com $arq -A "$NAVEGADOR")"
done
conferir "Página inexistente dá 404"           "404 "  "$(pedir dccircuitlabs.com /nao-existe/ -H "X-Forwarded-For: $BR" -A "$NAVEGADOR")"
CABECALHOS=$(curl -skI --resolve "dccircuitlabs.com:$PORTA:127.0.0.1" "https://dccircuitlabs.com:$PORTA/" -H "X-Forwarded-For: $BR")
conferir "HSTS"                                "*Strict-Transport-Security*"          "$CABECALHOS"
conferir "nosniff"                             "*X-Content-Type-Options: nosniff*"    "$CABECALHOS"
conferir "Versão do Nginx escondida"           "server: nginx"                      "$(echo "$CABECALHOS" | grep -i '^server:' | tr -d '\r')"
conferir "GLB com tipo correto"                "*model/gltf-binary*"                  "$(curl -skI --resolve "dccircuitlabs.com:$PORTA:127.0.0.1" "https://dccircuitlabs.com:$PORTA/models/placa-metabee.glb" | grep -i content-type)"

echo
echo "$OK ok, $FALHAS falha(s)"
[[ $FALHAS -eq 0 ]]
