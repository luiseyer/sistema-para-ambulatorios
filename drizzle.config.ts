import { defineConfig } from "drizzle-kit"
import { DATABASE_PATH } from "$lib/db/connection.server"

export default defineConfig({
  out: "./src/lib/db/migrations",
  schema: "./src/lib/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: { url: DATABASE_PATH },
  verbose: true,
  strict: true,
})
