// Cria o espaço PORTAL no Confluence com as páginas-modelo (cliente, projeto, versão) e um guia de uso.
// Pode rodar de novo: o que já existe é mantido.
//
//   CONFLUENCE_EMAIL=… CONFLUENCE_TOKEN=… node scripts/preparar-confluence.mjs
//   (no VPS: node --env-file=/srv/apps/portal/.env scripts/preparar-confluence.mjs)
const BASE = (process.env.CONFLUENCE_URL ?? 'https://dccircuitlabs.atlassian.net/wiki').replace(/\/$/, '');
const ESPACO = process.env.CONFLUENCE_ESPACO ?? 'PORTAL';
if (!process.env.CONFLUENCE_EMAIL || !process.env.CONFLUENCE_TOKEN) {
  console.error('Defina CONFLUENCE_EMAIL e CONFLUENCE_TOKEN.');
  process.exit(1);
}
const AUTH = 'Basic ' + Buffer.from(`${process.env.CONFLUENCE_EMAIL}:${process.env.CONFLUENCE_TOKEN}`).toString('base64');

async function api(metodo, caminho, corpo) {
  const r = await fetch(BASE + caminho, {
    method: metodo,
    headers: { authorization: AUTH, accept: 'application/json', 'content-type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${caminho} → ${r.status}: ${texto.slice(0, 300)}`);
  return texto ? JSON.parse(texto) : null;
}

// Texto de instrução: aparece em cinza só no editor e some ao digitar; não é publicado no portal.
const instrucao = (t) => `<p><ac:placeholder>${t}</ac:placeholder></p>`;
const tabela = (linhas) =>
  `<table><tbody>${linhas.map(([k, v]) => `<tr><th><p>${k}</p></th><td>${v}</td></tr>`).join('')}</tbody></table>`;

const GUIA = `
<p>Este espaço alimenta o <strong>Portal do Cliente</strong> (portal.dccircuitlabs.com). O que estiver aqui aparece para o cliente
quando alguém clicar em <strong>Publicar</strong> no painel (ou na publicação automática, todo dia às 3h).</p>
<h2>Estrutura</h2>
<ul>
<li><strong>Página na raiz do espaço = cliente.</strong> Precisa ter o CNPJ escrito nela, e o cliente precisa estar cadastrado no painel.</li>
<li><strong>Página filha do cliente = projeto.</strong> Opcional: tabela com as linhas “Status” e “Valor”.</li>
<li><strong>Página filha do projeto = versão da documentação</strong> (ex.: “Versão 1.0”). É isso que o cliente lê.</li>
</ul>
<h2>Como criar</h2>
<ol>
<li>Abra o modelo certo (abaixo), use <strong>⋯ → Copiar</strong> e escolha como página-mãe o cliente ou o projeto.</li>
<li>Troque o título. O Confluence não aceita dois títulos iguais no espaço, então inclua o nome:
cliente “Metabee”, projeto “Wi-Fi Connect”, versão “Wi-Fi Connect — Versão 1.0”. O portal usa o número depois de “Versão”.</li>
<li>Preencha. O texto cinza de instrução some ao digitar; seção que ficar vazia não aparece no portal.</li>
<li>Nova versão: copie a versão anterior e altere só o que mudou (preencha “O que mudou”).</li>
</ol>
<h2>Anexos (arraste para a página)</h2>
<ul>
<li><code>.glb</code> → visualizador 3D (exporte do SolidWorks/Fusion; o portal otimiza)</li>
<li><code>.mp4</code> / <code>.webm</code> → vídeo de montagem</li>
<li><code>.pdf</code> → aberto no navegador + download</li>
<li><code>ibom….html</code> → BOM interativa</li>
<li>Gerber, STEP, BOM em CSV e outros → lista de downloads</li>
<li>Imagens inseridas no texto aparecem no texto.</li>
</ul>
<h2>Rótulos</h2>
<ul>
<li><code>rascunho</code> → a página (e o que estiver abaixo dela) não é publicada até tirar o rótulo.</li>
<li><code>modelo</code> / <code>ignorar</code> numa página da raiz → não é cliente (como esta).</li>
</ul>
<p>Página apagada no Confluence (ou marcada como rascunho) sai do portal na próxima publicação.
Links para outras páginas do Confluence viram texto simples para o cliente.</p>`;

const MODELO_CLIENTE = `
${tabela([
  ['CNPJ', instrucao('00.000.000/0000-00 — o mesmo cadastrado no painel do portal')],
  ['Razão social', instrucao('Nome da empresa')],
])}
${instrucao('Anotações internas sobre o cliente podem ficar aqui; o portal só usa o CNPJ desta página.')}`;

const MODELO_PROJETO = `
${tabela([
  ['Status', instrucao('Ex.: Em desenvolvimento, Em produção, Entregue')],
  ['Valor', instrucao('Ex.: R$ 12.500,00 (opcional)')],
])}
${instrucao('As páginas filhas desta são as versões da documentação (Versão 1.0, Versão 1.1…).')}`;

const SECOES = [
  ['Visão geral', 'O que é a placa/o equipamento, para que serve e onde é usado.'],
  ['Especificações', 'Alimentação, consumo, interfaces, dimensões, temperatura de operação.'],
  ['Esquemático', 'Anexe o PDF do esquemático e comente os blocos principais.'],
  ['Layout e BOM', 'Camadas, dimensões da placa, BOM (anexe o CSV e a iBOM, se houver).'],
  ['Ligações', 'Conectores, pinagem e como ligar ao restante do sistema.'],
  ['Firmware', 'Versão, como gravar, parâmetros de configuração.'],
  ['Testes', 'Procedimento de teste e resultados esperados.'],
  ['Montagem', 'Passo a passo; anexe os vídeos de montagem (.mp4).'],
  ['Observações de campo', 'Cuidados de instalação, problemas conhecidos.'],
  ['O que mudou', 'Diferenças em relação à versão anterior (apague na primeira versão).'],
];
const MODELO_VERSAO = SECOES.map(([t, i]) => `<h1>${t}</h1>${instrucao(i)}`).join('\n');

async function espaco() {
  const r = await api('GET', `/api/v2/spaces?keys=${ESPACO}`);
  if (r.results[0]) {
    console.log(`Espaço ${ESPACO} já existe.`);
    return r.results[0];
  }
  await api('POST', '/rest/api/space', {
    key: ESPACO,
    name: 'Portal de Clientes',
    description: { plain: { value: 'Documentação publicada no Portal do Cliente (portal.dccircuitlabs.com).', representation: 'plain' } },
  });
  console.log(`Espaço ${ESPACO} criado.`);
  return (await api('GET', `/api/v2/spaces?keys=${ESPACO}`)).results[0];
}

async function pagina(espacoId, titulo, corpo, paiId, rotulos = [], atualizar = false) {
  const busca = await api('GET', `/api/v2/spaces/${espacoId}/pages?title=${encodeURIComponent(titulo)}&limit=5`);
  if (busca.results[0]) {
    const id = busca.results[0].id;
    if (atualizar) {
      const atual = await api('GET', `/api/v2/pages/${id}`);
      await api('PUT', `/api/v2/pages/${id}`, {
        id, status: 'current', title: titulo, body: { representation: 'storage', value: corpo }, version: { number: atual.version.number + 1, message: 'Guia atualizado' },
      });
      console.log(`  atualizada: ${titulo}`);
    } else console.log(`  já existe: ${titulo}`);
    return id;
  }
  const p = await api('POST', '/api/v2/pages', {
    spaceId: espacoId,
    status: 'current',
    title: titulo,
    ...(paiId ? { parentId: paiId } : {}),
    body: { representation: 'storage', value: corpo },
  });
  if (rotulos.length) await api('POST', `/rest/api/content/${p.id}/label`, rotulos.map((name) => ({ prefix: 'global', name })));
  console.log(`  criada: ${titulo}`);
  return p.id;
}

const e = await espaco();
// Abaixo da página inicial (Home), como as páginas que se criam pela barra lateral
const guia = await pagina(e.id, 'Como usar este espaço (modelos)', GUIA, e.homepageId, ['modelo'], true);
await pagina(e.id, 'Modelo — Cliente', MODELO_CLIENTE, guia);
await pagina(e.id, 'Modelo — Projeto', MODELO_PROJETO, guia);
await pagina(e.id, 'Modelo — Versão 1.0', MODELO_VERSAO, guia); // ao copiar: “Nome do projeto — Versão 1.0”
console.log(`Pronto: ${BASE}/spaces/${ESPACO}`);
