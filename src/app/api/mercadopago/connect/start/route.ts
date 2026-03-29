import { randomUUID } from "crypto"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { BaseException } from "@/exceptions/base/base-exceptions"
import { MercadoPagoService } from "@/services/mercadopago/mercadopago.service"

export const runtime = "nodejs"

const mpService = new MercadoPagoService()
const MP_OAUTH_STATE_COOKIE = "mp_oauth_state"

export async function GET(request: Request) {
  try {
    const state = randomUUID()
    const cookieStore = await cookies()

    cookieStore.set(MP_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    })

    return NextResponse.redirect(mpService.getAuthorizationUrl(state))
  } catch (error) {
    const message = error instanceof BaseException
      ? error.userMessage ?? error.message
      : "No pudimos iniciar la vinculación con Mercado Pago."
    const url = new URL("/movements", request.url)
    url.searchParams.set("mp", "error")
    url.searchParams.set("message", message)
    return NextResponse.redirect(url)
  }
}
