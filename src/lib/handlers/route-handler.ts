import { NextResponse } from "next/server"

import { BaseException } from "@/exceptions/base/base-exceptions"
import { getHttpStatusCode } from "@/lib/handlers/http-error-mapper"

interface RouteHandlerOptions {
  cacheSeconds?: number
  staleWhileRevalidate?: number
}

export async function routeHandler<T>(fn: () => Promise<T>, options?: RouteHandlerOptions) {
  try {
    const data = await fn()

    const headers: Record<string, string> = {}
    if (options?.cacheSeconds) {
      const swr = options.staleWhileRevalidate ?? options.cacheSeconds * 2
      headers["Cache-Control"] = `private, max-age=${options.cacheSeconds}, stale-while-revalidate=${swr}`
    }

    return NextResponse.json({ data }, { status: 200, headers })
  } catch (error) {
    const statusCode = getHttpStatusCode(error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const userMessage = error instanceof BaseException ? error.userMessage : undefined

    console.error("Error in routeHandler:", error)

    return NextResponse.json(
      { error: { statusCode, message, userMessage } },
      { status: statusCode },
    )
  }
}
