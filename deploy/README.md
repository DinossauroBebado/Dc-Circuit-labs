# Deploy — VPS Hostinger

O site é **100% estático**: o build gera HTML/CSS/JS em `dist/`, e o Nginx serve esses arquivos.
Não há Node rodando no servidor (o visualizador 3D roda no navegador do visitante), então **o pm2 não é necessário agora** —
ele entra quando o backend do portal do cliente existir (ver "Portal do cliente" abaixo).

```
Sua máquina                                  VPS (Ubuntu)
───────────                                  ────────────
npm run build  ──rsync──►  /var/www/dccircuitlabs.com/releases/20261024-221500/
                           /var/www/dccircuitlabs.com/current ─► (versão no ar)
                           /var/www/portal.dccircuitlabs.com/    (página "em breve")
                           /srv/apps/                            (futuros backends: portal)
                           Nginx :443 ── dccircuitlabs.com, www, portal (Let's Encrypt)
```

## Arquivos desta pasta

| Arquivo | Para quê |
| --- | --- |
| `bootstrap-vps.sh` | Prepara o servidor uma vez: pacotes, usuário `deploy`, pastas, GeoIP, Nginx, HTTPS, firewall, SSH, atualizações automáticas |
| `deploy.sh` | Publica uma nova versão (ou volta para a anterior com `--voltar`) |
| `atualizar-geoip.sh` | Baixa a base de países por IP (roda todo mês sozinho no VPS) |
| `nginx/conf.d/dc-idioma-por-ip.conf` | Escolhe PT/EN/ZH pelo país do IP |
| `nginx/conf.d/dc-geral.conf` | gzip, esconder versão do Nginx |
| `nginx/sites-available/dccircuitlabs.com.conf` | Site principal (HTTP→HTTPS, www→domínio, cache, idioma) |
| `nginx/sites-available/portal.dccircuitlabs.com.conf` | Portal do cliente (proxy para o app, arquivos protegidos, limite de tentativas de login) |
| `portal-bootstrap.sh` | Prepara o VPS para o portal, uma vez, como root (Node 22, pm2, pastas, `.env`, backup, Nginx) |
| `portal-deploy.sh` | Publica uma nova versão do portal |
| `portal-backup.sh` | Backup diário do banco e dos arquivos do portal (instalado pelo `portal-bootstrap.sh`) |
| `nginx/snippets/` | TLS, cabeçalhos de segurança, desafio do Let's Encrypt |
| `portal-em-breve/` | Página de manutenção do portal (aparece se o app estiver fora do ar) |
| `teste-local/` | Réplica do servidor em Docker para testar tudo antes (`./deploy/teste-local/testar.sh`) |

## Passo a passo — primeira vez

### 1. DNS (HostGator)

O domínio continua registrado na HostGator; só os apontamentos mudam. No painel de DNS da HostGator:

| Tipo | Nome | Valor |
| --- | --- | --- |
| A | `@` (dccircuitlabs.com) | IP do VPS |
| A | `www` | IP do VPS |
| A | `portal` | IP do VPS |
| AAAA | os mesmos três | IPv6 do VPS (se a Hostinger fornecer) |

Dica: um dia antes, baixe o TTL desses registros para 300 s — a troca propaga mais rápido. Remova os registros antigos que apontam
para o GitHub Pages (`185.199.108–111.153` e o CNAME de `www`). **Não mexa nos registros de e-mail (MX, SPF, DKIM)**.
Confira com `dig +short dccircuitlabs.com` antes de seguir: precisa responder o IP do VPS.

### 2. Acesso ao VPS com chave SSH

Se ainda não tem uma chave: `ssh-keygen -t ed25519`. Depois cadastre-a no root:

```bash
ssh-copy-id root@IP_DO_VPS
```

### 3. Preparar o servidor (uma vez)

```bash
rsync -av deploy/ root@IP_DO_VPS:/root/dc-deploy/
ssh root@IP_DO_VPS "bash /root/dc-deploy/bootstrap-vps.sh contato@dccircuitlabs.com \"$(cat ~/.ssh/id_ed25519.pub)\""
```

O script instala Nginx + módulo GeoIP2 + Certbot, cria o usuário `deploy` (só chave, sem sudo), emite os certificados de
`dccircuitlabs.com`/`www` e de `portal.dccircuitlabs.com`, liga a renovação automática, o firewall e as atualizações de segurança.
**Antes de fechar o terminal**, teste em outro: `ssh deploy@dccircuitlabs.com`.

### 4. Publicar

```bash
cp .env.example .env      # preencha PUBLIC_GA4_ID e PUBLIC_GSC_VERIFICATION
./deploy/deploy.sh
```

## Atualizações futuras

```bash
./deploy/deploy.sh            # build + envio + troca instantânea
./deploy/deploy.sh --voltar   # deu problema? volta para a versão anterior
```

O script se recusa a publicar se `INCLUIR_NAO_AUTORIZADOS=true` estiver ativo. As 5 últimas versões ficam no servidor.
Para usar outro endereço: `DC_SERVIDOR=deploy@IP_DO_VPS ./deploy/deploy.sh`.

## HTTPS

- Certificados Let's Encrypt em modo webroot, um para o site (`dccircuitlabs.com` + `www`) e outro só para o portal.
- Renovação: o pacote `certbot` instala um timer do systemd que roda 2x por dia; o hook em
  `/etc/letsencrypt/renewal-hooks/deploy/recarregar-nginx.sh` recarrega o Nginx após cada renovação.
- Conferir: `sudo certbot certificates` e `systemctl list-timers | grep certbot`.

## Idioma por IP

`nginx/conf.d/dc-idioma-por-ip.conf` consulta a base gratuita **DB-IP IP to Country Lite** (licença CC BY 4.0 — o crédito
"Geolocalização por IP: DB-IP" está no rodapé do site, como a licença exige). A base é atualizada no dia 5 de cada mês pelo
timer `atualizar-geoip.timer`. Regras:

- Só páginas da versão em português (sem prefixo) são redirecionadas; `/en/` e `/zh/` nunca.
- O cookie `lang` (gravado pelo seletor de idioma) vale mais que o IP.
- Robôs (Google, Bing, GPTBot, ClaudeBot, PerplexityBot, prévias de WhatsApp etc.) nunca são redirecionados.
- IP desconhecido → português.

Teste local completo (29 verificações, incluindo IPs do Brasil, EUA, China, Taiwan e Portugal):

```bash
npm run build && ./deploy/teste-local/testar.sh
```

## Google Analytics e Search Console

- **GA4:** crie a propriedade, copie o ID de medição (`G-…`) para `PUBLIC_GA4_ID` no `.env` e publique. O site mostra um aviso de
  cookies e só carrega o Google depois que o visitante aceita (LGPD). O fluxo de contato envia o evento `generate_lead` com a fase da
  ideia, o perfil, o canal (WhatsApp/e-mail) e a origem.
- **Search Console:** adicione a propriedade `https://dccircuitlabs.com`, escolha "Tag HTML" e cole só o valor de `content` em
  `PUBLIC_GSC_VERIFICATION`. (Alternativa: verificação por registro TXT no DNS da HostGator.) Depois envie
  `https://dccircuitlabs.com/sitemap.xml` em "Sitemaps".
- **Origem dos leads:** use links com `?utm_source=instagram` / `?utm_source=linkedin` na bio e nos posts — a origem vai junto na
  mensagem do WhatsApp/e-mail.

## Portal do cliente (portal.dccircuitlabs.com)

App próprio em `portal/` (Astro 7 + Node 22 + SQLite), rodando em `127.0.0.1:3100` pelo pm2, atrás do Nginx.
Banco e arquivos ficam em `/srv/apps/portal/dados/` (nunca são tocados pelo deploy); as senhas e chaves em `/srv/apps/portal/.env`.

**Uma vez, como root** (instala Node 22, pm2 e a configuração do Nginx do portal):

```bash
rsync -av -e "ssh -p 22022" deploy/ root@143.95.173.37:/root/dc-deploy/
ssh -p 22022 root@143.95.173.37 'bash /root/dc-deploy/portal-bootstrap.sh'
```

Depois, no VPS, preencha `/srv/apps/portal/.env` e rode `pm2 restart portal`:

| Variável | De onde vem |
| --- | --- |
| `SMTP_SENHA` | Senha da caixa `portal@dccircuitlabs.com` na Titan (e-mails de confirmação e de senha) |
| `CONFLUENCE_EMAIL`, `CONFLUENCE_TOKEN` | E-mail de uma conta Atlassian com acesso ao espaço `PORTAL` + token criado em id.atlassian.com → Segurança → Tokens de API |
| `BLING_CLIENT_ID`, `BLING_CLIENT_SECRET` | App de integração criado em developer.bling.com.br. Link de redirecionamento: `https://portal.dccircuitlabs.com/admin/bling/retorno`. Escopos: contatos, contas a receber e NF-e (leitura) |

**Notas fiscais** são enviadas à mão no painel (ficha do cliente ou **Fiscal**): PDF da DANFE e, se houver, o XML da NF-e — com o XML,
número, série, data e valor são lidos dele e o CNPJ do destinatário é conferido. A integração com o Bling está pronta mas **desligada**;
para ligar: `BLING_ATIVO=true` + `BLING_CLIENT_ID/SECRET` no `.env`, `pm2 restart portal` e **Bling → Conectar Bling** no painel
(ela também traz as contas a receber, que ativam a área Financeiro). O Confluence publica **todo dia às 3h** (e quando alguém clica em **Publicação → Publicar tudo** ou
em **Publicar este cliente** na ficha).

O mesmo bootstrap instala o **backup diário às 4h** (`/srv/apps/portal/backups/`, 14 dias: banco comprimido + foto dos arquivos com
hard links). Ele fica no mesmo disco — mantenha também o backup/snapshot da Hostinger ligado. Para rodar na hora: `sudo systemctl start portal-backup`.

Os links antigos da documentação (`dccircuitlabs.com/metabee/…`, `/rogge/…`, `/dnk/…`) redirecionam (301) para o portal pela
configuração do site — vale depois de copiar `nginx/sites-available/dccircuitlabs.com.conf` para o VPS e recarregar o Nginx (root).

**Publicar (e a cada atualização):**

```bash
DC_SERVIDOR=deploy@143.95.173.37 DC_SSH="ssh -p 22022" ./deploy/portal-deploy.sh
```

**Criar o acesso de um sócio ao painel** (gera uma senha temporária; no primeiro login ele configura o app autenticador e troca a senha):

```bash
ssh -p 22022 deploy@143.95.173.37
cd /srv/apps/portal/app/portal && node --env-file=/srv/apps/portal/.env scripts/criar-admin.mjs "Nome" email@dominio
# perdeu o celular do autenticador?  … scripts/criar-admin.mjs --redefinir email@dominio
```

Clientes são cadastrados no próprio painel (`/admin/clientes/novo`): ele mostra a senha temporária uma vez, com a mensagem pronta para mandar por WhatsApp.

**Como a documentação é escrita no Confluence** (espaço `PORTAL`): página na raiz = cliente (com o CNPJ escrito nela) → página filha =
projeto (tabela opcional com "Status" e "Valor") → página neta = versão da documentação, com os anexos. Rótulo `rascunho` esconde a
página; `modelo`/`ignorar` numa página raiz marca que ela não é cliente. Detalhes na própria tela **Publicação** do painel.

**Testes:** `./dev.sh npm test` (regras, renderização do Confluence, contas do financeiro) e `./dev.sh npx astro check`.

**Desenvolvimento local** (a máquina tem Node 20; o portal roda num container com Node 22): `cd portal && ./dev.sh npm install`,
`./dev.sh email` (caixa de e-mails de teste em http://localhost:8025) e `./dev.sh npm run dev` (http://localhost:4400).

## Checklist de segurança do servidor

O `bootstrap-vps.sh` já aplica os itens marcados. Confira depois de rodar:

- [x] **Firewall (ufw):** só 22, 80 e 443 abertas — `sudo ufw status`. Se a Hostinger tiver firewall no painel, libere as mesmas portas lá.
- [x] **SSH só com chave:** senha desligada (`/etc/ssh/sshd_config.d/99-dc-somente-chave.conf`); root só entra com chave.
      Teste `ssh -o PubkeyAuthentication=no root@IP` — precisa ser recusado.
- [x] **Usuário de deploy sem sudo:** o `deploy` só escreve em `/var/www/dccircuitlabs.com` e `/var/www/portal.dccircuitlabs.com`.
- [x] **Atualizações automáticas de segurança:** `unattended-upgrades` ligado — `systemctl status unattended-upgrades`.
- [x] **HTTPS obrigatório** com HSTS, TLS 1.2+ e versão do Nginx escondida.
- [x] **Cabeçalhos de segurança:** `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] **Backup/snapshot** do VPS no painel da Hostinger (o site em si está no git; o que importa guardar é `/etc/nginx`, `/etc/letsencrypt` e, no futuro, os dados do portal).
- [ ] **Fail2ban** (opcional, recomendável quando o portal tiver login): `apt install fail2ban`.
- [ ] **Content-Security-Policy:** não ativada ainda — precisa liberar o Google Analytics e, se os modelos 3D reais vierem com compressão Draco, `www.gstatic.com`. Ativar em modo `Report-Only` primeiro.
- [ ] Revisar a cada trimestre: `sudo apt list --upgradable`, `sudo certbot certificates`, `sudo ufw status`.
