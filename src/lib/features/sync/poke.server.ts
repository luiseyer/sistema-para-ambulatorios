import { EventEmitter } from "node:events"

const bus = new EventEmitter()

export const onPoke = (cb: () => void) => {
  bus.on("poke", cb)
  return () => bus.off("poke", cb)
}

export const broadcastPoke = () => bus.emit("poke")
