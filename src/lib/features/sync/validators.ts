import * as v from "valibot"
import type { SyncTableName } from "./types"

const BaseMutation = {
  id: v.pipe(v.string(), v.nonEmpty()),
  entity_type: v.pipe(v.string(), v.nonEmpty()),
}

const Payload = {
  id: v.pipe(v.string(), v.nonEmpty()),
  version: v.pipe(v.number(), v.integer(), v.toMinValue(0)),
}

export const Mutation = v.variant("operation", [
  v.object({
    operation: v.picklist(["create", "update"]),
    ...BaseMutation,
    payload: v.objectWithRest(
      { ...Payload, deleted_at: v.null() },
      v.unknown()
    ),
  }),
  v.object({
    operation: v.literal("delete"),
    ...BaseMutation,
    payload: v.objectWithRest(
      { ...Payload, deleted_at: v.pipe(v.string(), v.isoDateTime()) },
      v.unknown()
    ),
  }),
])

export const PushRequest = v.object({
  mutations: v.array(Mutation),
})

export const PullRequest = v.object({
  client_version: v.pipe(
    v.string(),
    v.toNumber(),
    v.integer(),
    v.toMinValue(0)
  ),
})

export type Mutation = Omit<v.InferOutput<typeof Mutation>, "entity_type"> & {
  entity_type: SyncTableName
}
export type PushRequest = { mutations: Mutation[] }
export type PullRequest = v.InferOutput<typeof PullRequest>
