import { Result } from "better-result"
import { eq } from "drizzle-orm"
import type { Transaction } from "$lib/server/db/connection"
import { sync_state } from "$lib/server/db/schema"
import { DatabaseError } from "./errors"

export function getGlobalVersion(
  tx: Transaction
): Result<number, DatabaseError> {
  return Result.try({
    try: () =>
      tx
        .select({ value: sync_state.value })
        .from(sync_state)
        .where(eq(sync_state.key, "global_version"))
        .get()?.value ?? 0,
    catch: (cause) =>
      new DatabaseError({
        message: "Error al obtener la versión global",
        cause,
      }),
  })
}

export function setGlobalVersion(
  tx: Transaction,
  version: number
): Result<void, DatabaseError> {
  return Result.try({
    try: () => {
      tx.insert(sync_state)
        .values({ key: "global_version", value: version })
        .onConflictDoUpdate({
          target: sync_state.key,
          set: { value: version },
        })
        .run()
    },
    catch: (cause) =>
      new DatabaseError({
        message: "Error al establecer la versión global",
        cause,
      }),
  })
}
