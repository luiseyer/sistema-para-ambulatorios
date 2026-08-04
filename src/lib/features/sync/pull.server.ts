import { Result } from "better-result"
import { sql } from "drizzle-orm"
import type { Transaction } from "$lib/db/connection.server"
import { DatabaseError } from "./errors"
import { SYNC_EXCLUSION_POLICY, SYNC_TABLES } from "./policy"
import { getGlobalVersion } from "./queries.server"

type SyncRow = Record<string, unknown>

type PatchEntry =
  | { op: "put"; key: string; data: SyncRow }
  | { op: "del"; key: string }
  | { op: "clear" }

function runQueries(
  tx: Transaction,
  clientVersion: number
): Result<{ name: string; rows: SyncRow[] }[], DatabaseError> {
  return Result.try({
    try: () =>
      Array.from(SYNC_TABLES, ([name, table]) => ({
        name,
        rows: tx
          .select()
          .from(table)
          .where(sql`version > ${clientVersion}`)
          .all() as SyncRow[],
      })),
    catch: (cause) =>
      new DatabaseError({ message: "Error al ejecutar consultas", cause }),
  })
}

function stripFields(rows: readonly SyncRow[], name: string): SyncRow[] {
  const fields = new Set<string>(
    SYNC_EXCLUSION_POLICY.fields[
      name as keyof typeof SYNC_EXCLUSION_POLICY.fields
    ] ?? []
  )

  if (fields.size === 0) return rows as SyncRow[]

  return rows.map((row) => {
    const cleaned: SyncRow = {}
    for (const [key, value] of Object.entries(row)) {
      if (!fields.has(key)) cleaned[key] = value
    }
    return cleaned
  })
}

function toEntries(name: string, rows: readonly SyncRow[]): PatchEntry[] {
  return rows.map((row) => {
    const { id, ...data } = row
    return row.deleted_at
      ? { op: "del" as const, key: `${name}/${id}` }
      : { op: "put" as const, key: `${name}/${id}`, data }
  })
}

export function pull(
  tx: Transaction,
  clientVersion: number
): Result<{ global_version: number; patch: PatchEntry[] }, DatabaseError> {
  return Result.gen(function* () {
    const version = yield* getGlobalVersion(tx)
    const queries = yield* runQueries(tx, clientVersion)
    const patch: PatchEntry[] = version === 0 ? [{ op: "clear" }] : []

    for (const { name, rows } of queries) {
      const cleaned = stripFields(rows, name)
      const entries = toEntries(name, cleaned)
      patch.push(...entries)
    }

    return Result.ok({ global_version: version, patch })
  })
}
