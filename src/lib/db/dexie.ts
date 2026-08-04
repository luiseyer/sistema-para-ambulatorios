import Dexie from "dexie"
import type * as schema from "$lib/db/schema"
import type { SyncQueue, SyncTableName } from "$lib/features/sync/types"

// biome-ignore lint/suspicious/noUnsafeDeclarationMerging: AppDB interface extends Dexie
export class AppDB extends Dexie {
  constructor() {
    super("ambulatorio")

    this.version(1).stores({
      usuario: "id, deleted_at",
      centro_salud: "id, deleted_at",
      vivienda: "id, deleted_at",
      familia: "id, centro_salud_id, deleted_at",
      integrante: "id, familia_id, nro_cedula, deleted_at",
      patologia: "id, deleted_at",
      integrante_patologia: "id, integrante_id, patologia_id, deleted_at",
      condicion_vida: "id, familia_id, deleted_at",
      vivienda_fauna: "id, vivienda_id, deleted_at",
      catalogo: "id, categoria, deleted_at",
      sync_queue: "id, status",
    })
  }
}

export interface AppDB extends Dexie {
  usuario: Table<"usuario">
  centro_salud: Table<"centro_salud">
  vivienda: Table<"vivienda">
  familia: Table<"familia">
  integrante: Table<"integrante">
  patologia: Table<"patologia">
  integrante_patologia: Table<"integrante_patologia">
  condicion_vida: Table<"condicion_vida">
  vivienda_fauna: Table<"vivienda_fauna">
  catalogo: Table<"catalogo">
  sync_queue: Dexie.Table<SyncQueue, string>
}

type Table<T extends SyncTableName> = Dexie.Table<
  (typeof schema)[T]["$inferSelect"],
  string,
  (typeof schema)[T]["$inferInsert"]
>
