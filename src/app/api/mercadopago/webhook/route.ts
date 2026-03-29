import { createHmac, timingSafeEqual } from "crypto"

import { after, NextResponse } from "next/server"

import { MercadoPagoService } from "@/services/mercadopago/mercadopago.service"

export const runtime = "nodejs"

const mpService = new MercadoPagoService()

function parseSignatureHeader(signature: string | null) {
  if (!signature) {
    return null
  }

  const entries = signature
    .split(",")
    .map((segment) => segment.trim().split("="))
    .filter(([key, value]) => key && value)

  return Object.fromEntries(entries)
}

function isValidWebhookSignature(input: {
  dataId: string | null
  requestId: string | null
  signatureHeader: string | null
}) {
  const secret = process.env.MP_WEBHOOK_SECRET

  if (!secret) {
    return true
  }

  const signatureParts = parseSignatureHeader(input.signatureHeader)
  const ts = signatureParts?.ts
  const hash = signatureParts?.v1

  if (!ts || !hash || !input.dataId || !input.requestId) {
    return false
  }

  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${ts};`
  const expected = createHmac("sha256", secret).update(manifest).digest("hex")

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(hash))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => "")
  let body: { type?: string; data?: { id?: string | number } } = {}

  if (rawBody) {
    try {
      body = JSON.parse(rawBody) as { type?: string; data?: { id?: string | number } }
    } catch {
      body = {}
    }
  }

  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get("connectionId")

  if (
    body.type === "payment"
    && body.data?.id
    && connectionId
    && isValidWebhookSignature({
      dataId: String(body.data.id),
      requestId: request.headers.get("x-request-id"),
      signatureHeader: request.headers.get("x-signature"),
    })
  ) {
    after(async () => {
      await mpService.processWebhookPayment(connectionId, String(body.data?.id))
    })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
