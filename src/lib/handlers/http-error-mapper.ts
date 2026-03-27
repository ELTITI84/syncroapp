import { BaseException } from "@/exceptions/base/base-exceptions"

export function getHttpStatusCode(error: unknown): number {
  if (error instanceof BaseException) return error.statusCode
  return 500
}
