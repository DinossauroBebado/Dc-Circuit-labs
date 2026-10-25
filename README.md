# DC Circuit Labs — site institucional

Site estático multi-página em [Astro](https://astro.build), em português, inglês e chinês.
O briefing está na página **Site** do Confluence (Marketing); os textos seguem o Manual de Posicionamento de Marca e o Design System.

> **Status:** primeira versão, só local. Nada vai ao ar até as autorizações por escrito dos clientes (DC-87, DC-88).

## Rodar na sua máquina

Requer Node 20.3+ (testado com 20.19) e npm.

```bash
npm install
npm run dev          # http://localhost:4321 — mostra tudo, inclusive cases pendentes e rótulos de placeholder
npm run build        # gera dist/ — versão de produção (sem cases não autorizados)
npm run preview      # serve o dist/ para conferir o build
npm run check        # confere tipos e se os três idiomas têm os mesmos textos
```

## Onde mexer

| Quero mudar…                         | Arquivo                                   |
| ------------------------------------ | ----------------------------------------- |
| Qualquer texto (PT / EN / ZH)        | `src/i18n/pt.ts`, `en.ts`, `zh.ts`        |
| Foto, vídeo ou modelo 3D             | `src/data/midia.ts`                        |
| Liberar um case ou apoio             | `src/data/autorizacoes.ts` (`autorizado: true`) |
| Ordem/ícone dos serviços             | `src/data/servicos.ts`                     |
| E-mail, WhatsApp, CNPJ               | `src/i18n/index.ts` (`CONTATO`)            |
| Cores, tipografia, espaçamentos      | `src/styles/global.css` (tokens do Design System) |
| Layout de uma página                 | `src/views/<Página>.astro`                 |
| IDs do Google Analytics / Search Console | `.env` (modelo em `.env.example`)      |

O português é a referência: `en.ts` e `zh.ts` são tipados a partir dele, então `npm run check` acusa qualquer texto faltando.
A tradução para o chinês foi feita sem revisão humana — vale passar por um falante nativo antes de publicar.

## Páginas

Uma única rota (`src/pages/[...rota].astro`) gera as 13 páginas em cada idioma a partir de `src/i18n/rotas.ts`:

`/` · `/servicos/` · `/servicos/{eletronica-pcb, firmware, mecanica, integracao, manufatura, edge-ai, robotica}/` · `/cases/` · `/apoios/` · `/sobre/` · `/faq/` · `/contato/`
— e as mesmas com `/en/` e `/zh/` na frente. Os caminhos são iguais nos três idiomas de propósito: assim o Nginx redireciona por IP sem tabela de tradução.

Também são gerados no build: `sitemap.xml` (com `hreflang`), `llms.txt` (PT + EN) e os dados estruturados Schema.org
(`Organization` na home, `Service` + `BreadcrumbList` em cada serviço, `FAQPage` no FAQ). O `robots.txt` está em `public/`.

## Fotos, vídeos e modelos 3D

Tudo que ainda não existe aparece como um bloco com o gradiente da marca. No HTML fica um comentário
`<!-- PLACEHOLDER: substituir por "…" — src/data/midia.ts, item "…" -->` e, em `npm run dev`, o próprio bloco mostra
o que deve entrar ali e qual arquivo da pasta do Drive serve.

Para trocar por material real:

1. Baixe o bruto do Drive para `midia-bruta/` (fora do git).
2. `npm run midia -- midia-bruta/VIDEO.mp4 hero-laboratorio 00:00:04 8` (início e duração do trecho) — ou só `npm run midia -- midia-bruta/FOTO.jpg sobre-laboratorio` para foto.
3. Copie as linhas `src`/`poster` que o script imprime para o item em `src/data/midia.ts` e apague o comentário PLACEHOLDER.

**Modelos 3D:** os dois visualizadores usam modelos genéricos gerados por `npm run modelos`. Quando o CAD exportar os reais
em `.glb`, salve em `public/models/` e troque o `src` em `src/data/midia.ts`. O controle DNK em vista explodida precisa ter
uma animação chamada `explodir` (montado → explodido); o controle deslizante da página manda nela.
Troque também o `poster` (imagem estática mostrada antes de carregar e em conexão lenta) por um print do modelo real.

## Autorizações

`src/data/autorizacoes.ts` lista cada case e apoio com `autorizado: true/false`. Regras do Manual de Marca aplicadas:

- Sem autorização **por escrito**, o item fica de fora do `npm run build` (e do `llms.txt`). No `npm run dev` ele aparece com o selo "Pendente de autorização".
- O cliente industrial nunca é citado pelo nome — o case é anônimo mesmo depois de autorizado.
- A Copa Pinhão aparece como **patrocínio**, nunca como cliente.
- Os resultados dos cases estão como `[A preencher com o cliente…]` — não há números inventados.

## Neon ciano (`#00EDFF`)

Decisão de 24/10: o ciano do logo sai da exclusividade das redes sociais e vira destaque interativo no site.
Onde ele aparece:

- **Trilha de circuito** em "Como funciona" (home): uma trilha que acende conforme o scroll, ligando os nós de cada etapa.
- **Brilho que segue o cursor** na borda dos cards de serviço, perfis, etapas e opções do contato.
- Sublinhado do menu que termina num nó aceso; nó pulsante ao lado dos rótulos das páginas.
- Numerais grandes das etapas do processo, como nos posts de processo do Instagram (só sobre fundo escuro).
- Anel de foco do teclado nas seções escuras.

Regra: ciano nunca como texto sobre fundo claro (o contraste com branco é ~1,3:1). Tudo respeita "reduzir movimento" do sistema.
Atualizar o Design System com isso fica para depois que o visual for aprovado.

## Idioma

O visitante cai no idioma do país do IP (Brasil e lusófonos → PT; China, Taiwan, Hong Kong, Macau, Singapura → ZH; resto → EN).
Isso é feito no Nginx do VPS (`deploy/nginx/conf.d/dc-idioma-por-ip.conf`), não no navegador — por isso **não acontece em `npm run dev`**:
localmente, acesse `/en/` e `/zh/` direto. Escolher um idioma no seletor grava o cookie `lang`, que passa a valer mais que o IP.
Buscadores e robôs de IA nunca são redirecionados. Para testar o comportamento real: `./deploy/teste-local/testar.sh` (Docker).

## Publicar

Veja [deploy/README.md](deploy/README.md) — VPS Hostinger, Nginx, HTTPS, portal e checklist de segurança.

## Pendências antes de ir ao ar

- Autorizações por escrito (DC-87, DC-88) e resultados reais dos cases.
- Fotos/vídeos reais e os dois modelos 3D (DC-116).
- Revisão da tradução para o chinês.
- IDs do GA4 e do Search Console no `.env`.
- Migrar para **Node 22 + Astro 7**: o Astro 5 (usado aqui porque a máquina tem Node 20) tem alertas de segurança corrigidos só na v7. Quase todos afetam só sites com servidor (SSR); este site é estático, mas vale atualizar antes de publicar.
- As pastas antigas `dnk/`, `metabee/` e `rogge/` (documentação de clientes) não fazem parte do build novo: quando o DNS for para o VPS, esses links deixam de funcionar. Decidir antes se vão para o portal (DC-117).
