import { NextResponse } from "next/server"

import { BaseException } from "@/exceptions/base/base-exceptions"
import { getHttpStatusCode } from "@/lib/handlers/http-error-mapper"

export async function routeHandler<T>(fn: () => Promise<T>) {
  try {
    const data = await fn()
    return NextResponse.json({ data }, { status: 200 })
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
