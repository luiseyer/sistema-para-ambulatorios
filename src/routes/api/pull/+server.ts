import { error, type RequestHandler } from "@sveltejs/kit"
import { isTaggedError, Result } from "better-result"
import * as v from "valibot"
import { PullRequest } from "$lib/contracts/sync/patch"
import type { Database } from "$lib/server/db/connection"
import { DatabaseError, pull, ValidationError } from "$lib/server/sync"

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
    ok: (data) => Response.json(data, { status: 200 }),
    err: (cause) =>
      isTaggedError(cause)
        ? cause.toResponse()
        : error(500, "Error interno del servidor"),
  })
}
