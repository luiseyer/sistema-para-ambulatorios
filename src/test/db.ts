import { beforeEach } from "bun:test"
import { createDatabase, type Database } from "$lib/server/db/connection"

export function setupDb() {
  let db: Database

  beforeEach(() => {
    db = createDatabase()
  })

  return () => db
}
