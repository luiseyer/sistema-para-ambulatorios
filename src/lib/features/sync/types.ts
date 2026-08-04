import type { AnySQLiteColumn, AnySQLiteTable } from "drizzle-orm/sqlite-core"
import type * as schema from "$lib/db/schema"
import type { SYNC_EXCLUSION_POLICY } from "./policy"

export type TableWithMeta = AnySQLiteTable & {
  id: AnySQLiteColumn
  version: AnySQLiteColumn
}

export type SyncTableName = Exclude<
  keyof typeof schema,
  (typeof SYNC_EXCLUSION_POLICY.tables)[number]
>

export type SyncQueue = {
  id: string
  entity_type: SyncTableName
  operation: "create" | "update" | "delete"
  payload: Record<string, unknown>
  status: "pending" | "in_flight" | "error" | "discarded"
  created_at: string
}
