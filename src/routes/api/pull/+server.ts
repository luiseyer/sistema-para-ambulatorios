import { error, json, type RequestHandler } from "@sveltejs/kit"
import { isTaggedError, Result } from "better-result"
import * as v from "valibot"
import type { Database } from "$lib/db/connection.server"
import { DatabaseError, ValidationError } from "$lib/features/sync/errors"
import { pull } from "$lib/features/sync/pull.server"
import { PullRequest } from "$lib/features/sync/validators"

function getSearchParams(url: URL): Result<PullRequest, ValidationError> {
  const params = Object.fromEntries(url.searchParams.entries())
  const parsed = v.safeParse(PullRequest, params)
  return parsed.success
    ? Result.ok(parsed.output)
    : Result.err(
        new ValidationError({
          message: "Parámetros de URL inválidos",
          issues: parsed.issues,
        })
      )
}

function executePull(db: Database, globalVersion: number) {
  return Result.try({
    try: () =>
      db.transaction((tx) => {
        const result = pull(tx, globalVersion)
        if (result.isErr()) throw result.error
        return result.value
      }),
    catch: (cause): DatabaseError =>
      cause instanceof DatabaseError
        ? cause
        : new DatabaseError({ message: "Error al ejecutar pull", cause }),
  })
}

export const GET: RequestHandler = ({ url, locals }) => {
  const response = Result.gen(function* () {
    const db = yield* locals.db
    const { client_version } = yield* getSearchParams(url)
    const result = yield* executePull(db, client_version)
    return Result.ok(result)
  })

  return response.match({
    ok: (data) => json(data, { status: 200 }),
    err: (cause) =>
      isTaggedError(cause)
        ? cause.toResponse()
        : error(500, "Error interno del servidor"),
  })
}
