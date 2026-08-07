import type { Handle } from "@sveltejs/kit"
import { Result } from "better-result"
import { createDatabase, DATABASE_PATH } from "$lib/server/db/connection"
import { DatabaseError } from "$lib/server/sync"

const db = Result.try({
  try: () => createDatabase(DATABASE_PATH),
  catch: (cause) =>
    new DatabaseError({
      message: "Error al conectar con la base de datos",
      cause,
    }),
})

export const handle: Handle = ({ event, resolve }) => {
  event.locals.db = db
  return resolve(event)
}
