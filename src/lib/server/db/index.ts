import Database from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { env } from "$lib/env"
import * as schema from "./schema"

const client = new Database(env.DATABASE_URL)

export const db = drizzle(client, { schema })
