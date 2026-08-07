import * as v from "valibot"

export const PullRequest = v.object({
  client_version: v.pipe(
    v.string(),
    v.toNumber(),
    v.integer(),
    v.toMinValue(0)
  ),
})

export type SyncRow = Record<string, unknown>

export type PatchEntry =
  | { op: "put"; key: string; data: SyncRow }
  | { op: "del"; key: string; data: { deleted_at: string } }
  | { op: "clear" }

export type PullRequest = v.InferOutput<typeof PullRequest>

export type PullResponse = { global_version: number; patch: PatchEntry[] }
