PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notas_fiscais` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`projeto_id` integer,
	`bling_id` text,
	`origem` text DEFAULT 'bling' NOT NULL,
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
INSERT INTO `__new_notas_fiscais`("id", "cliente_id", "projeto_id", "bling_id", "origem", "numero", "serie", "emissao", "valor", "situacao", "pdf_arquivo_id", "xml_arquivo_id", "criado_em") SELECT "id", "cliente_id", "projeto_id", "bling_id", 'bling', "numero", "serie", "emissao", "valor", "situacao", "pdf_arquivo_id", "xml_arquivo_id", "criado_em" FROM `notas_fiscais`;--> statement-breakpoint
DROP TABLE `notas_fiscais`;--> statement-breakpoint
ALTER TABLE `__new_notas_fiscais` RENAME TO `notas_fiscais`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `notas_fiscais_bling_id_unique` ON `notas_fiscais` (`bling_id`);