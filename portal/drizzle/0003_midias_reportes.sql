CREATE TABLE `midias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`projeto_id` integer,
	`tipo` text NOT NULL,
	`titulo` text,
	`arquivo_id` integer NOT NULL,
	`miniatura_id` integer,
	`tela_id` integer,
	`largura` integer,
	`altura` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`arquivo_id`) REFERENCES `arquivos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`miniatura_id`) REFERENCES `arquivos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tela_id`) REFERENCES `arquivos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `midias_cliente` ON `midias` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `reportes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`documento_id` integer,
	`documento_titulo` text NOT NULL,
	`secao_id` text,
	`secao_titulo` text,
	`trecho` text,
	`arquivo_nome` text,
	`comentario` text NOT NULL,
	`resolvido_em` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`documento_id`) REFERENCES `documentos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reportes_cliente` ON `reportes` (`cliente_id`);