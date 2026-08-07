import { describe, expect, test } from "bun:test"
import { getGlobalVersion, setGlobalVersion } from "$lib/server/sync/queries"
import { expectOk } from "$test/assert"
import { setupDb } from "$test/db"

const getDb = setupDb()

describe("queries", () => {
  test("`getGlobalVersion` retorna 0 cuando `sync_state` está vacío", () => {
    const db = getDb()
    const result = db.transaction((tx) => getGlobalVersion(tx))
    expect(expectOk(result)).toBe(0)
  })

  test("`getGlobalVersion` retorna el valor previamente guardado", () => {
    const db = getDb()
    db.transaction((tx) => setGlobalVersion(tx, 5))
    const result = db.transaction((tx) => getGlobalVersion(tx))
    expect(expectOk(result)).toBe(5)
  })

  test("`setGlobalVersion` sobreescribe la versión existente", () => {
    const db = getDb()
    db.transaction((tx) => setGlobalVersion(tx, 5))
    db.transaction((tx) => setGlobalVersion(tx, 10))
    const result = db.transaction((tx) => getGlobalVersion(tx))
    expect(expectOk(result)).toBe(10)
  })
})
