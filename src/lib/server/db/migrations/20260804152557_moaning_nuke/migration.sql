CREATE TABLE `archivo_adjunto` (
	`id` text PRIMARY KEY,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`data` blob NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `auditoria` (
	`id` text PRIMARY KEY,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`user_id` text,
	`status_code` integer NOT NULL,
	`reason` text,
	`ip_address` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `catalogo` (
	`id` text PRIMARY KEY,
	`categoria` text NOT NULL,
	`valor` text NOT NULL,
	`orden` integer DEFAULT 0,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `centro_salud` (
	`id` text PRIMARY KEY,
	`asic` text NOT NULL,
	`consultorio` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `condicion_vida` (
	`id` text PRIMARY KEY,
	`familia_id` text NOT NULL,
	`categoria` text NOT NULL,
	`valor_condicion` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text,
	CONSTRAINT `fk_condicion_vida_familia_id_familia_id_fk` FOREIGN KEY (`familia_id`) REFERENCES `familia`(`id`)
);
--> statement-breakpoint
CREATE TABLE `familia` (
	`id` text PRIMARY KEY,
	`centro_salud_id` text NOT NULL,
	`vivienda_id` text NOT NULL,
	`nro_hc` text NOT NULL UNIQUE,
	`nombre_familia` text NOT NULL,
	`direccion` text NOT NULL,
	`estado` text NOT NULL,
	`municipio` text NOT NULL,
	`parroquia` text NOT NULL,
	`ontogenesis` text NOT NULL,
	`numero_generaciones` text NOT NULL,
	`etapa_desarrollo` text NOT NULL,
	`familiograma` text,
	`discusion_evaluacion` text,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text,
	CONSTRAINT `fk_familia_centro_salud_id_centro_salud_id_fk` FOREIGN KEY (`centro_salud_id`) REFERENCES `centro_salud`(`id`),
	CONSTRAINT `fk_familia_vivienda_id_vivienda_id_fk` FOREIGN KEY (`vivienda_id`) REFERENCES `vivienda`(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrante` (
	`id` text PRIMARY KEY,
	`familia_id` text NOT NULL,
	`nro_cedula` text NOT NULL UNIQUE,
	`nombres` text NOT NULL,
	`apellidos` text NOT NULL,
	`fecha_nacimiento` text NOT NULL,
	`sexo` text NOT NULL,
	`escolaridad` text NOT NULL,
	`grupo_dispensarial` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text,
	CONSTRAINT `fk_integrante_familia_id_familia_id_fk` FOREIGN KEY (`familia_id`) REFERENCES `familia`(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrante_patologia` (
	`id` text PRIMARY KEY,
	`integrante_id` text NOT NULL,
	`patologia_id` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text,
	CONSTRAINT `fk_integrante_patologia_integrante_id_integrante_id_fk` FOREIGN KEY (`integrante_id`) REFERENCES `integrante`(`id`),
	CONSTRAINT `fk_integrante_patologia_patologia_id_patologia_id_fk` FOREIGN KEY (`patologia_id`) REFERENCES `patologia`(`id`),
	CONSTRAINT `integrante_patologia_integrante_id_patologia_id_unique` UNIQUE(`integrante_id`,`patologia_id`)
);
--> statement-breakpoint
CREATE TABLE `patologia` (
	`id` text PRIMARY KEY,
	`descripcion` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`created_at` text,
	`expires_at` text,
	CONSTRAINT `fk_session_user_id_usuario_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuario`(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY,
	`value` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `usuario` (
	`id` text PRIMARY KEY,
	`username` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`nombres` text NOT NULL,
	`apellidos` text NOT NULL,
	`rol` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `vivienda` (
	`id` text PRIMARY KEY,
	`es_hacinamiento` integer NOT NULL,
	`tiene_servicio_electrico` integer NOT NULL,
	`tipo_vivienda` text NOT NULL,
	`tipo_material_construccion` text NOT NULL,
	`tipo_techo` text NOT NULL,
	`tipo_piso` text NOT NULL,
	`tipo_abasto_agua` text NOT NULL,
	`tipo_bano_sanitario` text NOT NULL,
	`estado_constructivo` text NOT NULL,
	`destino_residuales_liquidos` text NOT NULL,
	`destino_desechos_solidos` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `vivienda_fauna` (
	`id` text PRIMARY KEY,
	`vivienda_id` text NOT NULL,
	`clasificacion` text NOT NULL,
	`especie` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text,
	CONSTRAINT `fk_vivienda_fauna_vivienda_id_vivienda_id_fk` FOREIGN KEY (`vivienda_id`) REFERENCES `vivienda`(`id`),
	CONSTRAINT `vivienda_fauna_vivienda_id_clasificacion_especie_unique` UNIQUE(`vivienda_id`,`clasificacion`,`especie`)
);
--> statement-breakpoint
CREATE INDEX `archivo_adjunto_version` ON `archivo_adjunto` (`version`);--> statement-breakpoint
CREATE INDEX `catalogo_version` ON `catalogo` (`version`);--> statement-breakpoint
CREATE INDEX `centro_salud_version` ON `centro_salud` (`version`);--> statement-breakpoint
CREATE INDEX `condicion_vida_version` ON `condicion_vida` (`version`);--> statement-breakpoint
CREATE INDEX `familia_version` ON `familia` (`version`);--> statement-breakpoint
CREATE INDEX `integrante_version` ON `integrante` (`version`);--> statement-breakpoint
CREATE INDEX `integrante_patologia_version` ON `integrante_patologia` (`version`);--> statement-breakpoint
CREATE INDEX `patologia_version` ON `patologia` (`version`);--> statement-breakpoint
CREATE INDEX `usuario_version` ON `usuario` (`version`);--> statement-breakpoint
CREATE INDEX `vivienda_version` ON `vivienda` (`version`);--> statement-breakpoint
CREATE INDEX `vivienda_fauna_version` ON `vivienda_fauna` (`version`);