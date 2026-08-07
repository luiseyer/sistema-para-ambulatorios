import type { SyncTableName } from "./tables"

type SyncPolicy = {
  tables: readonly string[]
  fields: Partial<Record<SyncTableName, readonly string[]>>
}

export const SYNC_EXCLUSION_POLICY = {
  tables: ["sync_state", "session", "auditoria"],
  fields: { usuario: ["password_hash"] },
} as const satisfies SyncPolicy
