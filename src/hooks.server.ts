import type { Handle } from "@sveltejs/kit"
import { Result } from "better-result"
import { createDatabase, DATABASE_PATH } from "$lib/db/connection.server"
import { DatabaseError } from "$lib/features/sync/errors"

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
