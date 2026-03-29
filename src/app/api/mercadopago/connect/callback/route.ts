import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { BaseException, ValidationException } from "@/exceptions/base/base-exceptions"
import { MpOauthStateException } from "@/exceptions/mercadopago/mercadopago-exceptions"
import { MercadoPagoService } from "@/services/mercadopago/mercadopago.service"

export const runtime = "nodejs"

const mpService = new MercadoPagoService()
const MP_OAUTH_STATE_COOKIE = "mp_oauth_state"

export async function GET(request: Request) {
  const redirectUrl = new URL("/movements", request.url)

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const cookieStore = await cookies()
    const expectedState = cookieStore.get(MP_OAUTH_STATE_COOKIE)?.value

    cookieStore.delete(MP_OAUTH_STATE_COOKIE)

    if (!code) {
      throw new ValidationException("Callback de MP sin code", "Mercado Pago no devolvió un código de autorización.")
    }

    if (!state || !expectedState || state !== expectedState) {
      throw new MpOauthStateException()
    }

    await mpService.completeOAuthConnection(code)
    redirectUrl.searchParams.set("mp", "connected")
  } catch (error) {
    const message = error instanceof BaseException
      ? error.userMessage ?? error.message
      : "No pudimos completar la vinculación con Mercado Pago."
    redirectUrl.searchParams.set("mp", "error")
    redirectUrl.searchParams.set("message", message)
  }

  return NextResponse.redirect(redirectUrl)
}
