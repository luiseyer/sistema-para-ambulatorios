import type { Mutation } from "$lib/contracts/sync/mutation"
import type { SyncTableName } from "$lib/contracts/sync/tables"
import type * as schema from "$lib/server/db/schema"

export function buildSyncState(
  overrides: Partial<typeof schema.sync_state.$inferInsert> = {}
) {
  return { key: "global_version", value: 0, ...overrides }
}

export function buildPatologia(
  overrides: Partial<typeof schema.patologia.$inferInsert> = {}
) {
  return {
    id: crypto.randomUUID(),
    descripcion: "Patologia",
    version: 1,
    ...overrides,
  }
}

export function buildUsuario(
  overrides: Partial<typeof schema.usuario.$inferInsert> = {}
) {
  return {
    id: crypto.randomUUID(),
    username: crypto.randomUUID(),
    password_hash: "x".repeat(60),
    nombres: "Test",
    apellidos: "User",
    rol: "user" as const,
    version: 1,
    ...overrides,
  }
}

export function buildIntegrante(
  overrides: Partial<typeof schema.integrante.$inferInsert> = {}
) {
  return {
    id: crypto.randomUUID(),
    familia_id: "nonexistent",
    nro_cedula: crypto.randomUUID(),
    nombres: "Test",
    apellidos: "Integrante",
    fecha_nacimiento: "1990-01-01",
    sexo: "M" as const,
    escolaridad: "Primaria",
    grupo_dispensarial: "Adolescente",
    version: 1,
    ...overrides,
  }
}

export function buildMutation(
  overrides: {
    id?: string
    entity_type?: string
    operation?: string
    payload?: Record<string, unknown>
  } = {}
): Mutation {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    entity_type: (overrides.entity_type ?? "patologia") as SyncTableName,
    operation: (overrides.operation ?? "create") as "create",
    payload: {
      id: crypto.randomUUID(),
      version: 0,
      deleted_at: null,
      ...(overrides.entity_type === undefined ||
      overrides.entity_type === "patologia"
        ? { descripcion: "Test" }
        : {}),
      ...overrides.payload,
    },
  } as Mutation
}
