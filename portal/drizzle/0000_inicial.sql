CREATE TABLE `acessos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer,
	`admin_id` integer,
	`evento` text NOT NULL,
	`alvo` text,
	`ip` text,
	`user_agent` text,
	`quando` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `acessos_cliente_quando` ON `acessos` (`cliente_id`,`quando`);--> statement-breakpoint
CREATE INDEX `acessos_evento_quando` ON `acessos` (`evento`,`quando`);--> statement-breakpoint
CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`deve_trocar_senha` integer DEFAULT true NOT NULL,
	`totp_segredo` text,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `arquivos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`projeto_id` integer,
	`documento_id` integer,
	`categoria` text NOT NULL,
	`nome` text NOT NULL,
	`caminho` text NOT NULL,
	`tamanho` integer NOT NULL,
	`mime` text NOT NULL,
	`origem` text NOT NULL,
	`origem_id` text,
	`sha256` text NOT NULL,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`documento_id`) REFERENCES `documentos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `arquivos_cliente` ON `arquivos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `arquivos_documento` ON `arquivos` (`documento_id`);--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cnpj` text NOT NULL,
	`razao_social` text NOT NULL,
	`email` text,
	`email_verificado_em` integer,
	`senha_hash` text NOT NULL,
	`deve_trocar_senha` integer DEFAULT true NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`bling_contato_id` text,
	`confluence_page_id` text,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_cnpj_unique` ON `clientes` (`cnpj`);--> statement-breakpoint
CREATE TABLE `contratos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`projeto_id` integer,
	`titulo` text NOT NULL,
	`assinado_em` integer,
	`arquivo_id` integer NOT NULL,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`arquivo_id`) REFERENCES `arquivos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documentos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projeto_id` integer NOT NULL,
	`versao` text NOT NULL,
	`titulo` text NOT NULL,
	`html` text NOT NULL,
	`sumario` text,
	`confluence_page_id` text,
	`confluence_versao` integer,
	`publicado_em` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documentos_confluence_page_id_unique` ON `documentos` (`confluence_page_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `documentos_projeto_versao` ON `documentos` (`projeto_id`,`versao`);--> statement-breakpoint
CREATE TABLE `notas_fiscais` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`projeto_id` integer,
	`bling_id` text NOT NULL,
	`numero` text NOT NULL,
	`serie` text,
	`emissao` integer,
	`valor` real,
	`situacao` text,
	`pdf_arquivo_id` integer,
	`xml_arquivo_id` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`pdf_arquivo_id`) REFERENCES `arquivos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`xml_arquivo_id`) REFERENCES `arquivos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notas_fiscais_bling_id_unique` ON `notas_fiscais` (`bling_id`);--> statement-breakpoint
CREATE TABLE `parcelas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`projeto_id` integer,
	`bling_conta_id` text NOT NULL,
	`descricao` text,
	`vencimento` integer NOT NULL,
	`valor` real NOT NULL,
	`valor_pago` real DEFAULT 0 NOT NULL,
	`pago_em` integer,
	`situacao` text,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parcelas_bling_conta_id_unique` ON `parcelas` (`bling_conta_id`);--> statement-breakpoint
CREATE TABLE `projetos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`nome` text NOT NULL,
	`slug` text NOT NULL,
	`status` text,
	`valor_total` real,
	`confluence_page_id` text,
	`atualizado_em` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projetos_confluence_page_id_unique` ON `projetos` (`confluence_page_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `projetos_cliente_slug` ON `projetos` (`cliente_id`,`slug`);--> statement-breakpoint
CREATE TABLE `sessoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`cliente_id` integer,
	`admin_id` integer,
	`segundo_fator_ok` integer DEFAULT false NOT NULL,
	`totp_pendente` text,
	`expira_em` integer NOT NULL,
	`ip` text,
	`user_agent` text,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessoes_token_hash_unique` ON `sessoes` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessoes_cliente` ON `sessoes` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `sessoes_admin` ON `sessoes` (`admin_id`);--> statement-breakpoint
CREATE TABLE `sincronizacoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fonte` text NOT NULL,
	`inicio` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`fim` integer,
	`status` text DEFAULT 'rodando' NOT NULL,
	`log` text,
	`admin_id` integer,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tokens_senha` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`cliente_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`email` text,
	`expira_em` integer NOT NULL,
	`usado_em` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_senha_token_hash_unique` ON `tokens_senha` (`token_hash`);