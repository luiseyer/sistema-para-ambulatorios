import { describe, expect, test } from "bun:test"
import type { RequestEvent } from "@sveltejs/kit"
import { Result } from "better-result"
import type { Database } from "$lib/db/connection.server"
import { broadcastPoke, onPoke } from "$lib/features/sync/poke.server"
import { GET as GET_EVENTS } from "$routes/api/events/+server"
import { GET } from "$routes/api/pull/+server"
import { POST } from "$routes/api/push/+server"
import { setupDb } from "$test/db"
import { buildMutation } from "$test/factories"

const getDb = setupDb()

function pushEvent(db: Database, request: Request): RequestEvent {
  return { request, locals: { db: Result.ok(db) } } as unknown as RequestEvent
}

function pullEvent(db: Database, url: URL): RequestEvent {
  return { url, locals: { db: Result.ok(db) } } as unknown as RequestEvent
}

function buildOversizedBatch(): string {
  return JSON.stringify({
    mutations: Array.from({ length: 101 }, (_, i) =>
      buildMutation({ id: `mut-${i + 1}` })
    ),
  })
}

describe("POST /api/push", () => {
  test("rechaza lotes con más de 100 mutaciones", async () => {
    const db = getDb()
    const request = new Request("http://test/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: buildOversizedBatch(),
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

  test("dispara broadcastPoke tras un push exitoso", async () => {
    const db = getDb()
    let poked = false
    const off = onPoke(() => {
      poked = true
    })

    try {
      const request = new Request("http://test/api/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mutations: [buildMutation({ payload: { id: "p-2" } })],
        }),
      })

      const response = await POST(pushEvent(db, request))
      expect(response.status).toBe(200)
      expect(poked).toBe(true)
    } finally {
      off()
    }
  })

  test("no dispara broadcastPoke cuando el push falla", async () => {
    const db = getDb()
    let poked = false
    const off = onPoke(() => {
      poked = true
    })

    try {
      const request = new Request("http://test/api/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: buildOversizedBatch(),
      })

      const response = await POST(pushEvent(db, request))
      expect(response.status).toBe(400)
      expect(poked).toBe(false)
    } finally {
      off()
    }
  })

  test("no dispara broadcastPoke cuando el push falla en la transacción", async () => {
    const db = getDb()
    let poked = false
    const off = onPoke(() => {
      poked = true
    })

    try {
      const request = new Request("http://test/api/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mutations: [
            buildMutation({
              entity_type: "integrante",
              payload: { id: "p-3", familia_id: "nonexistent" },
            }),
          ],
        }),
      })

      const response = await POST(pushEvent(db, request))
      expect(response.status).toBe(500)
      expect(poked).toBe(false)
    } finally {
      off()
    }
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

const POKE_FRAME = "event: poke\ndata: null\n\n"

// Lee chunks del stream acumulando hasta encontrar `expected`, con timeout
// para que un fallo no cuelgue el test (por ejemplo si nunca llega el frame).
function readUntilFrame(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  expected: string
): Promise<string> {
  const decoder = new TextDecoder()
  let received = ""
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            `Timeout esperando ${JSON.stringify(expected)}, recibido: ${JSON.stringify(received)}`
          )
        ),
      500
    )
    const finish = () => {
      clearTimeout(timer)
      resolve(received)
    }
    const read = async () => {
      const { value, done } = await reader.read()
      if (done) return finish()
      received += decoder.decode(value, { stream: true })
      if (received.includes(expected)) return finish()
      read()
    }
    read().catch(reject)
  })
}

function streamReader(
  response: Response
): ReadableStreamDefaultReader<Uint8Array> {
  if (!response.body)
    throw new Error("GET /api/events debería devolver un body")
  return response.body.getReader()
}

describe("GET /api/events", () => {
  test("responde 200 con headers de SSE", async () => {
    const response = GET_EVENTS()

    try {
      expect(response.status).toBe(200)
      expect(response.headers.get("content-type")).toBe("text/event-stream")
      expect(response.headers.get("cache-control")).toBe(
        "no-cache, no-transform"
      )
      expect(response.headers.get("connection")).toBe("keep-alive")
    } finally {
      // Cancelar el stream desuscribe el onPoke del handler y apaga su setInterval.
      await response.body?.cancel().catch(() => undefined)
    }
  })

  test("emite el frame de poke por el stream tras broadcastPoke", async () => {
    const response = GET_EVENTS()
    const reader = streamReader(response)

    try {
      broadcastPoke()
      const received = await readUntilFrame(reader, POKE_FRAME)
      expect(received).toBe(POKE_FRAME)
    } finally {
      await reader.cancel().catch(() => undefined)
    }
  })

  test("broadcastPoke no lanza tras cancelar el stream", async () => {
    const response = GET_EVENTS()
    const reader = streamReader(response)

    try {
      await reader.cancel()
      // Si el enqueue tras cancelar lanzara sin try/catch, esto propagaría el error.
      expect(() => broadcastPoke()).not.toThrow()
    } finally {
      await reader.cancel().catch(() => undefined)
    }
  })
})
