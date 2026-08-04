import { type ColumnBaseConfig, type ColumnType, sql } from "drizzle-orm"
import {
  blob,
  index,
  integer,
  type SQLiteColumn,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

const foreignKey = <T extends SQLiteColumn<ColumnBaseConfig<ColumnType>, T>>(
  ref: T
) =>
  text()
    .notNull()
    .references(() => ref)

const METADATA = {
  version: integer().notNull(),
  created_at: text().$default(() => sql`((datetime('now')))`),
  updated_at: text().$onUpdate(() => sql`((datetime('now')))`),
  deleted_at: text(),
}

export const usuario = sqliteTable(
  "usuario",
  {
    id: text().primaryKey(),
    username: text().unique().notNull(),
    password_hash: text().notNull(),
    nombres: text().notNull(),
    apellidos: text().notNull(),
    rol: text({ enum: ["admin", "user"] }).notNull(),
    ...METADATA,
  },
  ({ version }) => [index("usuario_version").on(version)]
)

export const centro_salud = sqliteTable(
  "centro_salud",
  {
    id: text().primaryKey(),
    asic: text().notNull(),
    consultorio: text().notNull(),
    ...METADATA,
  },
  ({ version }) => [index("centro_salud_version").on(version)]
)

export const vivienda = sqliteTable(
  "vivienda",
  {
    id: text().primaryKey(),
    es_hacinamiento: integer({ mode: "boolean" }).notNull(),
    tiene_servicio_electrico: integer({ mode: "boolean" }).notNull(),
    tipo_vivienda: text().notNull(),
    tipo_material_construccion: text().notNull(),
    tipo_techo: text().notNull(),
    tipo_piso: text().notNull(),
    tipo_abasto_agua: text().notNull(),
    tipo_bano_sanitario: text().notNull(),
    estado_constructivo: text().notNull(),
    destino_residuales_liquidos: text().notNull(),
    destino_desechos_solidos: text().notNull(),
    ...METADATA,
  },
  ({ version }) => [index("vivienda_version").on(version)]
)

export const familia = sqliteTable(
  "familia",
  {
    id: text().primaryKey(),
    centro_salud_id: foreignKey(centro_salud.id),
    vivienda_id: foreignKey(vivienda.id),
    nro_hc: text().unique().notNull(),
    nombre_familia: text().notNull(),
    direccion: text().notNull(),
    estado: text().notNull(),
    municipio: text().notNull(),
    parroquia: text().notNull(),
    ontogenesis: text().notNull(),
    numero_generaciones: text().notNull(),
    etapa_desarrollo: text().notNull(),
    familiograma: text(),
    discusion_evaluacion: text(),
    ...METADATA,
  },
  ({ version }) => [index("familia_version").on(version)]
)

export const integrante = sqliteTable(
  "integrante",
  {
    id: text().primaryKey(),
    familia_id: foreignKey(familia.id),
    nro_cedula: text().unique().notNull(),
    nombres: text().notNull(),
    apellidos: text().notNull(),
    fecha_nacimiento: text().notNull(),
    sexo: text({ enum: ["M", "F"] }).notNull(),
    escolaridad: text().notNull(),
    grupo_dispensarial: text().notNull(),
    ...METADATA,
  },
  ({ version }) => [index("integrante_version").on(version)]
)

export const patologia = sqliteTable(
  "patologia",
  {
    id: text().primaryKey(),
    descripcion: text().notNull(),
    ...METADATA,
  },
  ({ version }) => [index("patologia_version").on(version)]
)

export const integrante_patologia = sqliteTable(
  "integrante_patologia",
  {
    id: text().primaryKey(),
    integrante_id: foreignKey(integrante.id),
    patologia_id: foreignKey(patologia.id),
    ...METADATA,
  },
  (table) => [
    unique().on(table.integrante_id, table.patologia_id),
    index("integrante_patologia_version").on(table.version),
  ]
)

export const condicion_vida = sqliteTable(
  "condicion_vida",
  {
    id: text().primaryKey(),
    familia_id: foreignKey(familia.id),
    categoria: text().notNull(),
    valor_condicion: text().notNull(),
    ...METADATA,
  },
  ({ version }) => [index("condicion_vida_version").on(version)]
)

export const vivienda_fauna = sqliteTable(
  "vivienda_fauna",
  {
    id: text().primaryKey(),
    vivienda_id: foreignKey(vivienda.id),
    clasificacion: text({ enum: ["domestica", "nociva"] }).notNull(),
    especie: text().notNull(),
    ...METADATA,
  },
  (table) => [
    unique().on(table.vivienda_id, table.clasificacion, table.especie),
    index("vivienda_fauna_version").on(table.version),
  ]
)

export const catalogo = sqliteTable(
  "catalogo",
  {
    id: text().primaryKey(),
    categoria: text().notNull(),
    valor: text().notNull(),
    orden: integer().default(0),
    ...METADATA,
  },
  ({ version }) => [index("catalogo_version").on(version)]
)

export const archivo_adjunto = sqliteTable(
  "archivo_adjunto",
  {
    id: text().primaryKey(),
    entity_type: text().notNull(),
    entity_id: text().notNull(),
    filename: text().notNull(),
    content_type: text().notNull(),
    size: integer().notNull(),
    data: blob({ mode: "buffer" }).notNull(),
    ...METADATA,
  },
  ({ version }) => [index("archivo_adjunto_version").on(version)]
)

export const auditoria = sqliteTable("auditoria", {
  id: text().primaryKey(),
  action: text().notNull(),
  entity_type: text(),
  entity_id: text(),
  user_id: text(),
  status_code: integer().notNull(),
  reason: text(),
  ip_address: text(),
  created_at: METADATA.created_at,
})

export const session = sqliteTable("session", {
  id: text().primaryKey(),
  user_id: foreignKey(usuario.id),
  created_at: METADATA.created_at,
  expires_at: text().$default(() => sql`(datetime('now', '+72 hours'))`),
})

export const sync_state = sqliteTable("sync_state", {
  key: text().primaryKey(),
  value: integer().default(0),
})
