import { describe, expect, test } from "bun:test"
import { SYNC_EXCLUSION_POLICY, SYNC_TABLES } from "$lib/features/sync/policy"

describe("policy", () => {
  test("las tablas excluidas no están en `SYNC_TABLES`", () => {
    for (const name of SYNC_EXCLUSION_POLICY.tables) {
      expect(SYNC_TABLES.has(name)).toBe(false)
    }
  })

  test("`usuario` y `patologia` están en `SYNC_TABLES`", () => {
    expect(SYNC_TABLES.has("usuario")).toBe(true)
    expect(SYNC_TABLES.has("patologia")).toBe(true)
  })

  test("`SYNC_EXCLUSION_POLICY.fields` excluye `password_hash` de `usuario`", () => {
    expect(SYNC_EXCLUSION_POLICY.fields.usuario).toContain("password_hash")
  })
})
