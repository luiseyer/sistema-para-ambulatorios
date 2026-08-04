import * as schema from "$lib/db/schema"
import type { TableWithMeta } from "./types"

export const SYNC_EXCLUSION_POLICY = {
  tables: ["sync_state", "session", "auditoria"],
  fields: {
    usuario: ["password_hash"],
  },
} as const satisfies SyncPolicy

const excludedTables = new Set<string>(SYNC_EXCLUSION_POLICY.tables)

export const SYNC_TABLES = new Map<string, TableWithMeta>(
  Object.entries(schema)
    .filter(([name]) => !excludedTables.has(name))
    .map(([name, table]) => {
      if (!("id" in table && "version" in table))
        throw new Error(
          `Tabla ${name} añadida a sync no contiene columnas id/version`
        )
      return [name, table as TableWithMeta]
    })
)

type SyncPolicy = {
  tables: readonly (keyof typeof schema)[]
  fields: {
    [T in keyof typeof schema]?: readonly (keyof (typeof schema)[T]["$inferInsert"])[]
  }
}
