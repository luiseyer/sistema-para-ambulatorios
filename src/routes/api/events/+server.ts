import type { RequestHandler } from "@sveltejs/kit"
import { onPoke } from "$lib/server/sync"

const KEEP_ALIVE_INTERVAL_MS = 15_000
const KEEP_ALIVE_FRAME = ": keep-alive\n\n"
const POKE_FRAME = "event: poke\ndata: null\n\n"

export const GET: RequestHandler = ({ platform }) => {
  // Bun cierra conexiones idle a los 10s (idleTimeout) y un stream SSE
  // silencioso cuenta como idle. En producción (svelte-adapter-bun) esto
  // mataría la conexión entre frames de poke. Desactivar por request:
  platform?.server?.timeout?.(platform.request, 0)

  const encoder = new TextEncoder()
  const cleanup = { clean: () => undefined }

  const stream = new ReadableStream({
    start(controller) {
      const keepAliveInterval = setInterval(
        () => controller.enqueue(encoder.encode(KEEP_ALIVE_FRAME)),
        KEEP_ALIVE_INTERVAL_MS
      )

      const off = onPoke(() => {
        try {
          controller.enqueue(encoder.encode(POKE_FRAME))
        } catch (e) {
          console.error("poke enqueue failed:", e)
        }
      })

      cleanup.clean = () => {
        clearInterval(keepAliveInterval)
        off()
      }
    },
    cancel: () => cleanup.clean(),
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
