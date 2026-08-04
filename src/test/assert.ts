import type { Result } from "better-result"

export function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isErr()) {
    throw new Error(`Expected Ok, got Err: ${JSON.stringify(result.error)}`)
  }
  return result.value
}
