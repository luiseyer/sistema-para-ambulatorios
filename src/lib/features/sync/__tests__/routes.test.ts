import { describe, expect, test } from "bun:test"
import type { RequestEvent } from "@sveltejs/kit"
import { Result } from "better-result"
import type { Database } from "$lib/db/connection.server"
import { setupDb } from "$test/db"
import { buildMutation } from "$test/factories"
import { GET } from "../../../../routes/api/pull/+server"
import { POST } from "../../../../routes/api/push/+server"

const getDb = setupDb()

function pushEvent(db: Database, request: Request): RequestEvent {
  return { request, locals: { db: Result.ok(db) } } as unknown as RequestEvent
}

function pullEvent(db: Database, url: URL): RequestEvent {
  return { url, locals: { db: Result.ok(db) } } as unknown as RequestEvent
}

describe("POST /api/push", () => {
  test("rechaza lotes con más de 100 mutaciones", async () => {
    const db = getDb()
    const request = new Request("http://test/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mutations: Array.from({ length: 101 }, (_, i) =>
          buildMutation({ id: `mut-${i + 1}` })
        ),
      }),
    })

    const response = await POST(pushEvent(db, request))
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      type: "BatchTooLargeError",
      received: 101,
    })
  })

  test("aplica un lote válido y responde 200", async () => {
    const db = getDb()
    const request = new Request("http://test/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mutations: [buildMutation({ payload: { id: "p-1" } })],
      }),
    })

    const response = await POST(pushEvent(db, request))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ discarded_mutation_ids: [] })
  })

  test("rechaza cuerpos que no son JSON", async () => {
    const db = getDb()
    const request = new Request("http://test/api/push", {
      method: "POST",
      body: "no es json",
    })

    const response = await POST(pushEvent(db, request))
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ type: "ParseError" })
  })

  test("rechaza mutaciones con `operation` inválida", async () => {
    const db = getDb()
    const request = new Request("http://test/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mutations: [
          {
            id: "mut-1",
            entity_type: "patologia",
            operation: "invalid",
            payload: { id: "p-1", version: 0, deleted_at: null },
          },
        ],
      }),
    })

    const response = await POST(pushEvent(db, request))
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ type: "ValidationError" })
  })
})

describe("GET /api/pull", () => {
  test("responde 200 con `clear` para `client_version = 0`", async () => {
    const db = getDb()
    const response = await GET(
      pullEvent(db, new URL("http://test/api/pull?client_version=0"))
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      global_version: 0,
      patch: [{ op: "clear" }],
    })
  })

  test("rechaza `client_version` inválido", async () => {
    const db = getDb()
    const response = await GET(
      pullEvent(db, new URL("http://test/api/pull?client_version=abc"))
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ type: "ValidationError" })
  })
})
