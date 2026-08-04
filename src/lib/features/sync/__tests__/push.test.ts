import { describe, expect, test } from "bun:test"
import { eq } from "drizzle-orm"
import * as schema from "$lib/db/schema"
import { DatabaseError } from "$lib/features/sync/errors"
import { push } from "$lib/features/sync/push.server"
import { expectOk } from "$test/assert"
import { setupDb } from "$test/db"
import { buildIntegrante, buildMutation } from "$test/factories"
import { seedPatologia, seedSyncState } from "$test/seed"

const getDb = setupDb()

describe("push", () => {
  test("`create` inserta fila con `version = globalVersion + 1`", () => {
    const db = getDb()
    seedSyncState(db, 0)
    const result = db.transaction((tx) =>
      push(tx, [buildMutation({ payload: { id: "p-1" } })])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual([])
    expect(db.select().from(schema.patologia).get()?.version).toBe(1)
  })

  test("`create` con id duplicado se descarta sin modificar la fila existente", () => {
    const db = getDb()
    seedSyncState(db, 0)
    seedPatologia(db, { id: "p-1", version: 1 })

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          operation: "create",
          payload: { id: "p-1", version: 0, deleted_at: null },
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual(["mut-1"])
  })

  test("`create` duplicado dentro del mismo batch se descarta", () => {
    const db = getDb()
    seedSyncState(db, 0)

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({ id: "mut-1", payload: { id: "p-1" } }),
        buildMutation({ id: "mut-2", payload: { id: "p-1" } }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual(["mut-2"])
    expect(db.select().from(schema.sync_state).get()?.value).toBe(1)
  })

  test("`update` aplica cambio cuando `payload.version >= version` en DB", () => {
    const db = getDb()
    seedSyncState(db, 0)
    seedPatologia(db, { id: "p-1", version: 0 })

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          operation: "update",
          payload: { id: "p-1", version: 0, deleted_at: null },
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual([])
    expect(db.select().from(schema.patologia).get()?.version).toBe(1)
  })

  test("`update` se descarta cuando `payload.version < version` en DB (CAS conflict)", () => {
    const db = getDb()
    seedSyncState(db, 0)
    seedPatologia(db, { id: "p-1", version: 5 })

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          operation: "update",
          payload: { id: "p-1", version: 3, deleted_at: null },
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual(["mut-1"])
    expect(db.select().from(schema.patologia).get()?.version).toBe(5)
  })

  test("re-push del mismo lote se descarta por CAS (idempotencia)", () => {
    const db = getDb()
    seedSyncState(db, 0)
    seedPatologia(db, { id: "p-1", version: 0 })

    const mutation = buildMutation({
      id: "mut-1",
      operation: "update",
      payload: { id: "p-1", version: 0, deleted_at: null },
    })
    const first = db.transaction((tx) => push(tx, [mutation]))
    expect(expectOk(first).discarded_mutation_ids).toEqual([])
    const second = db.transaction((tx) => push(tx, [mutation]))
    expect(expectOk(second).discarded_mutation_ids).toEqual(["mut-1"])
    expect(db.select().from(schema.sync_state).get()?.value).toBe(1)
  })

  test("`update` se descarta cuando la fila no existe", () => {
    const db = getDb()
    seedSyncState(db, 0)

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          operation: "update",
          payload: { id: "p-999", version: 0, deleted_at: null },
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual(["mut-1"])
  })

  test("`delete` marca `deleted_at` y actualiza `version`", () => {
    const db = getDb()
    seedSyncState(db, 0)
    seedPatologia(db, { id: "p-1", version: 0 })

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          operation: "delete",
          payload: {
            id: "p-1",
            version: 0,
            deleted_at: "2026-07-28T12:00:00.000Z",
          },
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual([])
    const row = db.select().from(schema.patologia).get()
    expect(row?.deleted_at).toBe("2026-07-28T12:00:00.000Z")
    expect(row?.version).toBe(1)
  })

  test("`delete` se descarta cuando la fila no existe", () => {
    const db = getDb()
    seedSyncState(db, 0)

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          operation: "delete",
          payload: {
            id: "p-999",
            version: 0,
            deleted_at: "2026-07-28T12:00:00.000Z",
          },
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual(["mut-1"])
  })

  test("`push` con array vacío no cambia `globalVersion`", () => {
    const db = getDb()
    seedSyncState(db, 7)

    const result = db.transaction((tx) => push(tx, []))
    expect(expectOk(result).discarded_mutation_ids).toEqual([])
    expect(db.select().from(schema.sync_state).get()?.value).toBe(7)
  })

  test("`batch` incrementa `globalVersion` en el número de mutaciones aplicadas", () => {
    const db = getDb()
    seedSyncState(db, 0)

    const result = db.transaction((tx) =>
      push(
        tx,
        Array.from({ length: 3 }, (_, i) =>
          buildMutation({
            id: `mut-${i + 1}`,
            payload: { id: `p-${i + 1}`, descripcion: "Test" },
          })
        )
      )
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual([])
    expect(db.select().from(schema.sync_state).get()?.value).toBe(3)
  })

  test("`batch` descarta mutaciones inválidas y aplica las válidas", () => {
    const db = getDb()
    seedSyncState(db, 0)
    seedPatologia(db, { id: "p-stale", version: 5 })

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          payload: { id: "p-1", descripcion: "Test" },
        }),
        buildMutation({
          id: "mut-2",
          operation: "update",
          payload: { id: "p-stale", version: 3, deleted_at: null },
        }),
        buildMutation({
          id: "mut-3",
          payload: { id: "p-2", descripcion: "Test" },
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual(["mut-2"])
    expect(db.select().from(schema.sync_state).get()?.value).toBe(2)
  })

  test("`push` ignora mutaciones con `entity_type` no incluida en `SYNC_TABLES`", () => {
    const db = getDb()
    seedSyncState(db, 0)

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          id: "mut-1",
          entity_type: "auditoria" as any,
        }),
      ])
    )
    expect(expectOk(result).discarded_mutation_ids).toEqual(["mut-1"])
    expect(db.select().from(schema.sync_state).get()?.value).toBe(0)
  })

  test("rollback completo cuando `push` falla a mitad de batch", () => {
    const db = getDb()
    seedSyncState(db, 0)

    expect(() => {
      db.transaction((tx) => {
        const r = push(tx, [
          buildMutation({ payload: { id: "p-ok" } }),
          buildMutation({
            entity_type: "integrante",
            payload: buildIntegrante(),
          }),
        ])
        if (r.isErr()) throw r.error
        return r.value
      })
    }).toThrow(DatabaseError)

    expect(
      db
        .select()
        .from(schema.patologia)
        .where(eq(schema.patologia.id, "p-ok"))
        .get()
    ).toBeUndefined()
    expect(db.select().from(schema.sync_state).get()?.value).toBe(0)
  })

  test("`push` retorna `Result.err` cuando `applyMutation` falla", () => {
    const db = getDb()
    seedSyncState(db, 0)

    const result = db.transaction((tx) =>
      push(tx, [
        buildMutation({
          entity_type: "integrante",
          payload: buildIntegrante(),
        }),
      ])
    )

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(DatabaseError)
    }
  })
})
