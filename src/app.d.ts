// biome-ignore-all lint/style/noNamespace: App namespace is used by SvelteKit
// biome-ignore-all lint/style/useConsistentTypeDefinitions: interface is used by SvelteKit

import type { Result } from "better-result"
import type { Database } from "$lib/server/db/connection"
import type { DatabaseError } from "$lib/server/sync"
import type { Server } from "bun"

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: Result<Database, DatabaseError>
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      server: Server
      request: Request
    }
  }
}
