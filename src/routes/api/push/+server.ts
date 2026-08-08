import { error, type RequestHandler } from "@sveltejs/kit"
import { isTaggedError, Result } from "better-result"
import * as v from "valibot"
import { type Mutation, PushRequest } from "$lib/contracts/sync/mutation"
import type { Database } from "$lib/server/db/connection"
import {
  BatchTooLargeError,
  broadcastPoke,
  DatabaseError,
  ParseError,
  push,
  ValidationError,
} from "$lib/server/sync"

const MAX_BATCH_SIZE = 100

function parseBody(request: Request): Promise<Result<unknown, ParseError>> {
  return Result.tryPromise({
    try: () => request.json(),
    catch: (cause) => new ParseError({ message: "JSON inválido", cause }),
  })
}

function validateRequest(body: unknown): Result<PushRequest, ValidationError> {
  const parsed = v.safeParse(PushRequest, body)
  return parsed.success
    ? Result.ok(parsed.output as PushRequest)
    : Result.err(
        new ValidationError({
          message: "Cuerpo de la solicitud inválido",
          issues: parsed.issues,
        })
      )
}

function checkSize(req: PushRequest): Result<Mutation[], BatchTooLargeError> {
  return req.mutations.length > MAX_BATCH_SIZE
    ? Result.err(
        new BatchTooLargeError({
          message: "Demasiadas mutaciones",
          max: MAX_BATCH_SIZE,
          received: req.mutations.length,
        })
      )
    : Result.ok(req.mutations)
}

function executePush(db: Database, mutations: Mutation[]) {
  return Result.try({
    try: () =>
      db.transaction(
        (tx) => {
          const result = push(tx, mutations)
          if (result.isErr()) throw result.error
          return result.value
        },
        { behavior: "immediate" }
      ),
    catch: (cause) =>
      cause instanceof DatabaseError
        ? cause
        : new DatabaseError({ message: "Error al ejecutar push", cause }),
  })
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const response = await Result.gen(async function* () {
    const db = yield* locals.db
    const body = yield* Result.await(parseBody(request))
    const validated = yield* validateRequest(body)
    const mutations = yield* checkSize(validated)
    const result = yield* executePush(db, mutations)
    broadcastPoke()
    return Result.ok(result)
  })

  return response.match({
    ok: (data) => Response.json(data, { status: 200 }),
    err: (cause) =>
      isTaggedError(cause)
        ? cause.toResponse()
        : error(500, "Error interno del servidor"),
  })
}
