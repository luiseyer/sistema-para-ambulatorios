import { TaggedError } from "better-result"
import * as v from "valibot"

function error<T extends Record<string, unknown>>(status: number, data: T) {
  return Response.json(data, { status })
}

export class DatabaseError extends TaggedError("DatabaseError")<{
  message: string
  cause: unknown
}>() {
  toResponse() {
    return error(500, { type: this._tag, message: this.message })
  }
}

export class ValidationError extends TaggedError("ValidationError")<{
  message: string
  issues: readonly [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]
}>() {
  toResponse() {
    return error(400, {
      type: this._tag,
      message: this.message,
      issues: v.flatten(this.issues),
    })
  }
}

export class ParseError extends TaggedError("ParseError")<{
  message: string
  cause: unknown
}>() {
  toResponse() {
    return error(400, { type: this._tag, message: this.message })
  }
}

export class BatchTooLargeError extends TaggedError("BatchTooLargeError")<{
  message: string
  max: number
  received: number
}>() {
  toResponse() {
    return error(400, {
      type: this._tag,
      message: this.message,
      max: this.max,
      received: this.received,
    })
  }
}
