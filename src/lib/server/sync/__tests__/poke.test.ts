import { describe, expect, test } from "bun:test"
import { broadcastPoke, onPoke } from "$lib/server/sync"

// ponytail: el bus es global de módulo — cada test desuscribe en finally
// para no filtrar suscripciones entre tests del mismo archivo.
describe("poke", () => {
  test("broadcastPoke invoca los callbacks suscritos", () => {
    let calls = 0
    const off = onPoke(() => {
      calls += 1
    })

    try {
      broadcastPoke()
      expect(calls).toBe(1)
    } finally {
      off()
    }
  })

  test("el unsubscribe devuelto por onPoke detiene futuras invocaciones", () => {
    let unsubscribed = 0
    let remaining = 0
    const offUnsubscribed = onPoke(() => {
      unsubscribed += 1
    })
    const offRemaining = onPoke(() => {
      remaining += 1
    })
    offUnsubscribed()

    try {
      broadcastPoke()
      expect(unsubscribed).toBe(0)
      expect(remaining).toBe(1)
    } finally {
      offRemaining()
    }
  })

  test("múltiples suscriptores reciben todos el broadcast", () => {
    const calls = [0, 0, 0]
    const offs = [0, 1, 2].map((i) =>
      onPoke(() => {
        calls[i] += 1
      })
    )

    try {
      broadcastPoke()
      broadcastPoke()
      expect(calls).toEqual([2, 2, 2])
    } finally {
      for (const off of offs) off()
    }
  })
})
