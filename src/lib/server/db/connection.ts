import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"

export const DATABASE_PATH =
  process.env.NODE_ENV === "production"
    ? "ambulatorio.db"
    : "dev-ambulatorio.db"

export type Database = ReturnType<typeof drizzle>
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0]

export function createDatabase(path = ":memory:"): Database {
  const db = drizzle(path)
  db.run(sql`PRAGMA foreign_keys = ON`)
  migrate(db, { migrationsFolder: "./src/lib/server/db/migrations" })
  return db
}
