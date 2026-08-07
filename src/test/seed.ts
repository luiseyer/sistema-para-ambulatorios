import type { Database } from "$lib/server/db/connection"
import * as schema from "$lib/server/db/schema"
import { buildPatologia, buildSyncState } from "$test/factories"

export function seedSyncState(db: Database, version: number) {
  db.insert(schema.sync_state)
    .values(buildSyncState({ value: version }))
    .run()
}

export function seedPatologia(
  db: Database,
  overrides: Partial<typeof schema.patologia.$inferInsert> = {}
) {
  db.insert(schema.patologia).values(buildPatologia(overrides)).run()
}
