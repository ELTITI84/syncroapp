import { NextResponse } from "next/server"

import { BaseException } from "@/exceptions/base/base-exceptions"
import { getHttpStatusCode } from "@/lib/handlers/http-error-mapper"
import { TelegramIntakeService } from "@/services/intake/telegram-intake.service"

const telegramIntakeService = new TelegramIntakeService()

function isSecretValid(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  if (!expected) return true

  const received = request.headers.get("x-telegram-bot-api-secret-token")?.trim()
  return received === expected
}

export async function GET() {
  return NextResponse.json({
    data: {
      ok: true,
      message: "Webhook de Telegram listo.",
    },
  })
}

export async function POST(request: Request) {
  if (!isSecretValid(request)) {
    return NextResponse.json(
      { error: { statusCode: 401, message: "Invalid Telegram webhook secret", userMessage: "Webhook no autorizado." } },
      { status: 401 },
    )
  }

  try {
    const body = await request.json()
    const result = await telegramIntakeService.processUpdate(body)
    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    const statusCode = getHttpStatusCode(error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const userMessage = error instanceof BaseException ? error.userMessage : undefined

    console.error("Error in Telegram webhook:", error)

    return NextResponse.json(
      { error: { statusCode, message, userMessage } },
      { status: statusCode },
    )
  }
}
