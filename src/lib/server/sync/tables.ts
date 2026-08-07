import type { AnySQLiteColumn, AnySQLiteTable } from "drizzle-orm/sqlite-core"
import { SYNC_EXCLUSION_POLICY } from "$lib/contracts/sync/policy"
import * as schema from "$lib/server/db/schema"

const excludedTables = new Set<string>(SYNC_EXCLUSION_POLICY.tables)

export type TableWithMeta = AnySQLiteTable & {
  id: AnySQLiteColumn
  version: AnySQLiteColumn
}

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
