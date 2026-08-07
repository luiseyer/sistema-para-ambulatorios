import * as v from "valibot"

export const SyncTableName = [
  "usuario",
  "centro_salud",
  "vivienda",
  "familia",
  "integrante",
  "patologia",
  "integrante_patologia",
  "condicion_vida",
  "vivienda_fauna",
  "catalogo",
  "archivo_adjunto",
] as const
export type SyncTableName = (typeof SyncTableName)[number]

export const SyncStateClient = v.variant("key", [
  v.object({
    key: v.picklist(["client_version"]),
    value: v.pipe(v.number(), v.integer(), v.toMinValue(0)),
  }),
  v.object({
    key: v.literal("current_user_id"),
    value: v.pipe(v.string(), v.nonEmpty()),
  }),
  v.object({
    key: v.literal("last_sync_at"),
    value: v.pipe(v.string(), v.isoDateTime()),
  }),
])
export type SyncStateClient = v.InferOutput<typeof SyncStateClient>
