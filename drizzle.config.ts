import { defineConfig } from "drizzle-kit"
import { DATABASE_PATH } from "$lib/server/db/connection"

export default defineConfig({
  out: "./src/lib/server/db/migrations",
  schema: "./src/lib/server/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: { url: DATABASE_PATH },
  verbose: true,
  strict: true,
})
