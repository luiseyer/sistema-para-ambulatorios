import { beforeEach } from "bun:test"
import { createDatabase, type Database } from "$lib/db/connection.server"

export function setupDb() {
  let db: Database

  beforeEach(() => {
    db = createDatabase()
  })

  return () => db
}
