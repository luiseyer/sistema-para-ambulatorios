import { Result } from "better-result"
import { and, eq, lte } from "drizzle-orm"
import type { Mutation, PushResponse } from "$lib/contracts/sync/mutation"
import type { Transaction } from "$lib/server/db/connection"
import { DatabaseError } from "./errors"
import { getGlobalVersion, setGlobalVersion } from "./queries"
import { SYNC_TABLES } from "./tables"

function applyMutation(
  tx: Transaction,
  mutation: Mutation,
  globalVersion: number
): Result<{ applied: boolean }, DatabaseError> {
  return Result.try({
    try: () => {
      const { operation, entity_type, payload } = mutation

      const table = SYNC_TABLES.get(entity_type)
      if (!table) return { applied: false }

      if (operation === "create") {
        const { changes } = tx
          .insert(table)
          .values({ ...payload, version: globalVersion + 1 })
          .onConflictDoNothing({ target: table.id })
          .run()
        return { applied: changes > 0 }
      }

      const { changes } = tx
        .update(table)
        .set({ ...payload, version: globalVersion + 1 })
        .where(
          and(eq(table.id, payload.id), lte(table.version, payload.version))
        )
        .run()
      return { applied: changes > 0 }
    },
    catch: (cause) =>
      new DatabaseError({ message: "Error al aplicar mutación", cause }),
  })
}

export function push(
  tx: Transaction,
  mutations: Mutation[]
): Result<PushResponse, DatabaseError> {
  return Result.gen(function* () {
    let globalVersion = yield* getGlobalVersion(tx)
    const discardedMutationIds: string[] = []

    for (const mutation of mutations) {
      const { applied } = yield* applyMutation(tx, mutation, globalVersion)

      if (!applied) {
        discardedMutationIds.push(mutation.id)
        continue
      }

      globalVersion += 1
    }

    yield* setGlobalVersion(tx, globalVersion)

    return Result.ok({ discarded_mutation_ids: discardedMutationIds })
  })
}
