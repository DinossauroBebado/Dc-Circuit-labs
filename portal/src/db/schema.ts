// Banco do portal (SQLite). Datas em milissegundos (timestamp_ms).
// Mudou o schema? `npm run db:gerar` cria a migração em drizzle/ — commite o SQL gerado.
import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const agora = sql`(unixepoch('subsec') * 1000)`;
const criadoEm = () => integer('criado_em', { mode: 'timestamp_ms' }).notNull().default(agora);

export const clientes = sqliteTable('clientes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cnpj: text('cnpj').notNull().unique(), // só dígitos
  razaoSocial: text('razao_social').notNull(),
  email: text('email'),
  emailVerificadoEm: integer('email_verificado_em', { mode: 'timestamp_ms' }),
  senhaHash: text('senha_hash').notNull(),
  deveTrocarSenha: integer('deve_trocar_senha', { mode: 'boolean' }).notNull().default(true),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  blingContatoId: text('bling_contato_id'),
  confluencePageId: text('confluence_page_id'),
  criadoEm: criadoEm(),
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  deveTrocarSenha: integer('deve_trocar_senha', { mode: 'boolean' }).notNull().default(true),
  totpSegredo: text('totp_segredo'), // null até o admin configurar o app autenticador
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  criadoEm: criadoEm(),
});

export const sessoes = sqliteTable(
  'sessoes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tokenHash: text('token_hash').notNull().unique(),
    clienteId: integer('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }),
    adminId: integer('admin_id').references(() => admins.id, { onDelete: 'cascade' }),
    // Admin: a sessão só vale para o painel depois do código do app autenticador.
    segundoFatorOk: integer('segundo_fator_ok', { mode: 'boolean' }).notNull().default(false),
    totpPendente: text('totp_pendente'), // segredo gerado na configuração, antes da confirmação
    expiraEm: integer('expira_em', { mode: 'timestamp_ms' }).notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    criadoEm: criadoEm(),
  },
  (t) => [index('sessoes_cliente').on(t.clienteId), index('sessoes_admin').on(t.adminId)],
);

export const tokensSenha = sqliteTable('tokens_senha', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tokenHash: text('token_hash').notNull().unique(),
  clienteId: integer('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  tipo: text('tipo', { enum: ['redefinir_senha', 'verificar_email'] }).notNull(),
  email: text('email'), // e-mail sendo confirmado (verificar_email)
  expiraEm: integer('expira_em', { mode: 'timestamp_ms' }).notNull(),
  usadoEm: integer('usado_em', { mode: 'timestamp_ms' }),
  criadoEm: criadoEm(),
});

export const projetos = sqliteTable(
  'projetos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    slug: text('slug').notNull(),
    status: text('status'),
    valorTotal: real('valor_total'),
    confluencePageId: text('confluence_page_id').unique(),
    atualizadoEm: integer('atualizado_em', { mode: 'timestamp_ms' }),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex('projetos_cliente_slug').on(t.clienteId, t.slug)],
);

export const documentos = sqliteTable(
  'documentos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projetoId: integer('projeto_id')
      .notNull()
      .references(() => projetos.id, { onDelete: 'cascade' }),
    versao: text('versao').notNull(),
    titulo: text('titulo').notNull(),
    html: text('html').notNull(),
    sumario: text('sumario', { mode: 'json' }).$type<{ id: string; titulo: string; nivel: number }[]>(),
    confluencePageId: text('confluence_page_id').unique(),
    confluenceVersao: integer('confluence_versao'),
    publicadoEm: integer('publicado_em', { mode: 'timestamp_ms' }),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex('documentos_projeto_versao').on(t.projetoId, t.versao)],
);

export const arquivos = sqliteTable(
  'arquivos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    projetoId: integer('projeto_id').references(() => projetos.id, { onDelete: 'set null' }),
    documentoId: integer('documento_id').references(() => documentos.id, { onDelete: 'cascade' }),
    categoria: text('categoria', {
      enum: ['tecnico', 'video', 'modelo3d', 'fabricacao', 'contrato', 'nota_fiscal', 'midia', 'miniatura'],
    }).notNull(),
    nome: text('nome').notNull(),
    caminho: text('caminho').notNull(), // relativo a ARQUIVOS_DIR
    tamanho: integer('tamanho').notNull(),
    mime: text('mime').notNull(),
    origem: text('origem', { enum: ['confluence', 'upload', 'bling'] }).notNull(),
    origemId: text('origem_id'), // id do anexo no Confluence / da NF no Bling
    origemVersao: integer('origem_versao'), // versão do anexo no Confluence (evita baixar de novo)
    sha256: text('sha256').notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [index('arquivos_cliente').on(t.clienteId), index('arquivos_documento').on(t.documentoId)],
);

export const notasFiscais = sqliteTable('notas_fiscais', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clienteId: integer('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  projetoId: integer('projeto_id').references(() => projetos.id, { onDelete: 'set null' }),
  blingId: text('bling_id').unique(), // null nas notas enviadas à mão pelo painel
  origem: text('origem', { enum: ['bling', 'manual'] }).notNull().default('bling'),
  numero: text('numero').notNull(),
  serie: text('serie'),
  emissao: integer('emissao', { mode: 'timestamp_ms' }),
  valor: real('valor'),
  situacao: text('situacao'),
  pdfArquivoId: integer('pdf_arquivo_id').references(() => arquivos.id, { onDelete: 'set null' }),
  xmlArquivoId: integer('xml_arquivo_id').references(() => arquivos.id, { onDelete: 'set null' }),
  criadoEm: criadoEm(),
});

export const parcelas = sqliteTable('parcelas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clienteId: integer('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  projetoId: integer('projeto_id').references(() => projetos.id, { onDelete: 'set null' }),
  blingContaId: text('bling_conta_id').notNull().unique(),
  descricao: text('descricao'),
  vencimento: integer('vencimento', { mode: 'timestamp_ms' }).notNull(),
  valor: real('valor').notNull(),
  valorPago: real('valor_pago').notNull().default(0),
  pagoEm: integer('pago_em', { mode: 'timestamp_ms' }),
  situacao: text('situacao'),
  criadoEm: criadoEm(),
});

export const contratos = sqliteTable('contratos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clienteId: integer('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  projetoId: integer('projeto_id').references(() => projetos.id, { onDelete: 'set null' }),
  titulo: text('titulo').notNull(),
  assinadoEm: integer('assinado_em', { mode: 'timestamp_ms' }),
  arquivoId: integer('arquivo_id')
    .notNull()
    .references(() => arquivos.id),
  criadoEm: criadoEm(),
});

// Fotos e vídeos dos produtos prontos (aba Mídias). O original fica em `arquivoId`; nas fotos o portal gera uma
// miniatura (grade) e uma versão de tela (visualização ampliada). O download entrega sempre o original.
export const midias = sqliteTable(
  'midias',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    projetoId: integer('projeto_id').references(() => projetos.id, { onDelete: 'set null' }),
    tipo: text('tipo', { enum: ['foto', 'video'] }).notNull(),
    titulo: text('titulo'),
    arquivoId: integer('arquivo_id')
      .notNull()
      .references(() => arquivos.id),
    miniaturaId: integer('miniatura_id').references(() => arquivos.id, { onDelete: 'set null' }),
    telaId: integer('tela_id').references(() => arquivos.id, { onDelete: 'set null' }),
    largura: integer('largura'),
    altura: integer('altura'),
    criadoEm: criadoEm(),
  },
  (t) => [index('midias_cliente').on(t.clienteId)],
);

// "Reportar erro" na documentação: trecho/imagem marcado pelo cliente + comentário. Vai por e-mail e fica na ficha.
export const reportes = sqliteTable(
  'reportes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    documentoId: integer('documento_id').references(() => documentos.id, { onDelete: 'set null' }),
    documentoTitulo: text('documento_titulo').notNull(), // guardado: o documento pode sair do portal depois
    secaoId: text('secao_id'),
    secaoTitulo: text('secao_titulo'),
    trecho: text('trecho'),
    arquivoNome: text('arquivo_nome'), // imagem marcada
    comentario: text('comentario').notNull(),
    resolvidoEm: integer('resolvido_em', { mode: 'timestamp_ms' }),
    criadoEm: criadoEm(),
  },
  (t) => [index('reportes_cliente').on(t.clienteId)],
);

// Tudo o que acontece no portal: logins (certos e errados), páginas vistas, downloads, trocas de senha.
// Também alimenta o limite de tentativas de login.
export const acessos = sqliteTable(
  'acessos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clienteId: integer('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }),
    adminId: integer('admin_id').references(() => admins.id, { onDelete: 'cascade' }),
    evento: text('evento').notNull(),
    alvo: text('alvo'), // CNPJ/e-mail tentado, documento visto, arquivo baixado…
    ip: text('ip'),
    userAgent: text('user_agent'),
    quando: integer('quando', { mode: 'timestamp_ms' }).notNull().default(agora),
  },
  (t) => [index('acessos_cliente_quando').on(t.clienteId, t.quando), index('acessos_evento_quando').on(t.evento, t.quando)],
);

export const sincronizacoes = sqliteTable('sincronizacoes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fonte: text('fonte', { enum: ['confluence', 'bling'] }).notNull(),
  inicio: integer('inicio', { mode: 'timestamp_ms' }).notNull().default(agora),
  fim: integer('fim', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['rodando', 'ok', 'erro'] }).notNull().default('rodando'),
  log: text('log'),
  adminId: integer('admin_id').references(() => admins.id, { onDelete: 'set null' }),
});

// Configurações guardadas pelo próprio app (ex.: tokens do Bling, que se renovam sozinhos).
export const configuracoes = sqliteTable('configuracoes', {
  chave: text('chave').primaryKey(),
  valor: text('valor').notNull(),
  atualizadoEm: integer('atualizado_em', { mode: 'timestamp_ms' }).notNull().default(agora),
});

export type Cliente = typeof clientes.$inferSelect;
export type Admin = typeof admins.$inferSelect;
