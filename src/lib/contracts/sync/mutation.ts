import * as v from "valibot"
import { SyncTableName } from "./tables"

const PayloadBase = {
  id: v.pipe(v.string(), v.nonEmpty()),
  version: v.pipe(v.number(), v.integer(), v.toMinValue(0)),
}

const PayloadSchema = <T>(deletedAt: v.GenericSchema<unknown, T>) =>
  v.objectWithRest({ ...PayloadBase, deleted_at: deletedAt }, v.unknown())

const UpsertPayload = PayloadSchema(v.null())
const DeletePayload = PayloadSchema(v.pipe(v.string(), v.isoDateTime()))

const MutationBase = {
  id: v.pipe(v.string(), v.nonEmpty()),
  entity_type: v.pipe(
    v.string(),
    v.nonEmpty(),
    v.transform((s) => s as SyncTableName)
  ),
}

const SyncQueueBase = {
  id: v.pipe(v.string(), v.nonEmpty()),
  entity_type: v.picklist(SyncTableName),
  status: v.picklist(["pending", "in_flight", "error", "discarded"]),
  created_at: v.pipe(v.string(), v.isoDateTime()),
}

export const Payload = v.union([UpsertPayload, DeletePayload])

export const Mutation = v.variant("operation", [
  v.object({
    operation: v.picklist(["create", "update"]),
    payload: UpsertPayload,
    ...MutationBase,
  }),
  v.object({
    operation: v.literal("delete"),
    payload: DeletePayload,
    ...MutationBase,
  }),
])

export const PushRequest = v.object({
  mutations: v.array(Mutation),
})

export const SyncQueue = v.variant("operation", [
  v.object({
    operation: v.picklist(["create", "update"]),
    payload: UpsertPayload,
    ...SyncQueueBase,
  }),
  v.object({
    operation: v.literal("delete"),
    payload: DeletePayload,
    ...SyncQueueBase,
  }),
])

export type Payload = v.InferOutput<typeof Payload>
export type Mutation = v.InferOutput<typeof Mutation>
export type PushRequest = v.InferOutput<typeof PushRequest>
export type SyncQueue = v.InferOutput<typeof SyncQueue>
export type PushResponse = { discarded_mutation_ids: string[] }
