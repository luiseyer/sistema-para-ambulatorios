import { describe, expect, test } from "bun:test"
import * as schema from "$lib/db/schema"
import { pull } from "$lib/features/sync/pull.server"
import { expectOk } from "$test/assert"
import { setupDb } from "$test/db"
import { buildUsuario } from "$test/factories"
import { seedPatologia, seedSyncState } from "$test/seed"

const getDb = setupDb()

describe("pull", () => {
  test("`pull` retorna `clear` cuando la versión global del servidor es 0", () => {
    const db = getDb()
    const result = db.transaction((tx) => pull(tx, 0))

    expect(expectOk(result)).toEqual({
      global_version: 0,
      patch: [{ op: "clear" }],
    })
  })

  test("`pull` retorna patch vacío cuando el cliente ya tiene la última versión", () => {
    const db = getDb()
    seedSyncState(db, 10)

    const { patch } = expectOk(db.transaction((tx) => pull(tx, 10)))
    expect(patch).toEqual([])
  })

  test("`pull` retorna `put` por cada fila con `version > clientVersion`", () => {
    const db = getDb()
    seedSyncState(db, 10)
    seedPatologia(db, { id: "p-1", version: 11 })
    seedPatologia(db, { id: "p-2", version: 12 })

    const { patch } = expectOk(db.transaction((tx) => pull(tx, 10)))
    expect(patch).toHaveLength(2)
    expect(patch).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ op: "put", key: "patologia/p-1" }),
        expect.objectContaining({ op: "put", key: "patologia/p-2" }),
      ])
    )
  })

  test("`pull` con `client_version = 0` retorna todas las filas (initial sync)", () => {
    const db = getDb()
    seedSyncState(db, 5)
    seedPatologia(db, { id: "p-1", version: 1 })
    seedPatologia(db, { id: "p-2", version: 5 })

    const { patch } = expectOk(db.transaction((tx) => pull(tx, 0)))
    expect(patch).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ op: "put", key: "patologia/p-1" }),
        expect.objectContaining({ op: "put", key: "patologia/p-2" }),
      ])
    )
  })

  test("`pull` retorna patch vacío cuando el cliente está adelantado", () => {
    const db = getDb()
    seedSyncState(db, 3)
    seedPatologia(db, { id: "p-1", version: 4 })

    const result = expectOk(db.transaction((tx) => pull(tx, 99)))
    expect(result.global_version).toBe(3)
    expect(result.patch).toEqual([])
  })

  test("`pull` retorna `del` por cada fila con `deleted_at` seteado", () => {
    const db = getDb()
    seedSyncState(db, 5)
    seedPatologia(db, {
      id: "p-1",
      version: 6,
      deleted_at: "2026-07-28T12:00:00.000Z",
    })

    const { patch } = expectOk(db.transaction((tx) => pull(tx, 5)))
    expect(patch).toEqual([{ op: "del", key: "patologia/p-1" }])
  })

  test("`pull` no emite `del` para tombstones con `version <= client_version`", () => {
    const db = getDb()
    seedSyncState(db, 10)
    seedPatologia(db, {
      id: "p-1",
      version: 5,
      deleted_at: "2026-07-28T12:00:00.000Z",
    })

    const { patch } = expectOk(db.transaction((tx) => pull(tx, 10)))
    expect(patch).toEqual([])
  })

  test("`pull` no incluye campos excluidos por `SYNC_EXCLUSION_POLICY.fields`", () => {
    const db = getDb()
    seedSyncState(db, 0)
    db.insert(schema.usuario)
      .values(buildUsuario({ id: "u-1", username: "medico1", version: 1 }))
      .run()

    const { patch } = expectOk(db.transaction((tx) => pull(tx, 0)))
    const entry = patch.find(
      (e) => e.op === "put" && e.key === "usuario/u-1"
    ) as { op: "put"; key: string; data: Record<string, unknown> } | undefined
    expect(entry).toMatchObject({ op: "put", key: "usuario/u-1" })
    expect(entry?.data).toMatchObject({ username: "medico1", nombres: "Test" })
    expect(entry?.data).not.toHaveProperty("password_hash")
  })

  test("`pull` no retorna filas de tablas excluidas por `SYNC_EXCLUSION_POLICY`", () => {
    const db = getDb()
    seedSyncState(db, 10)
    seedPatologia(db, { id: "p-1", version: 11 })
    db.insert(schema.auditoria)
      .values({ id: "a-1", action: "login", status_code: 200 })
      .run()

    const { patch } = expectOk(db.transaction((tx) => pull(tx, 0)))
    expect(patch).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ op: "put", key: "patologia/p-1" }),
      ])
    )
    expect(patch.some((e) => "key" in e && e.key === "auditoria/a-1")).toBe(
      false
    )
  })
})
