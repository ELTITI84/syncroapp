import { BadRequestException } from "@/exceptions/base/base-exceptions"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/database.types"

type TelegramMessage = {
  message_id: number
  date?: number
  text?: string
  caption?: string
  chat?: {
    id?: number | string
    type?: string
  }
  from?: {
    id?: number
    username?: string
    first_name?: string
    last_name?: string
  }
  voice?: {
    file_id: string
    mime_type?: string
  }
  audio?: {
    file_id: string
    mime_type?: string
    title?: string
    performer?: string
  }
  document?: {
    file_id: string
    mime_type?: string
    file_name?: string
  }
}

type TelegramUpdate = {
  update_id?: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  channel_post?: TelegramMessage
}

type ResolvedUser = {
  id: string
  email: string
}

type ParsedMovement = {
  amount: number
  type: "income" | "expense"
  category: string
  description: string
  notes?: string
}

function toISODateFromUnix(seconds?: number) {
  const date = seconds ? new Date(seconds * 1000) : new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function extractMessage(update: TelegramUpdate) {
  return update.message ?? update.edited_message ?? update.channel_post ?? null
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function parseAmount(text: string) {
  const match = text.match(/(?:\$|ars?\s*)?(-?\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|-?\d+(?:,\d+)?)(?:\s*(k|mil|m|millon|millon(?:es)?))?/i)
  if (!match) return null

  const rawNumber = match[1].replace(/\s+/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")
  const base = Number(rawNumber)

  if (!Number.isFinite(base) || base === 0) {
    return null
  }

  const suffix = normalizeText(match[2] ?? "")
  if (suffix === "k" || suffix === "mil") return Math.round(base * 1_000)
  if (suffix === "m" || suffix === "millon" || suffix === "millones") return Math.round(base * 1_000_000)
  return Math.round(Math.abs(base))
}

function inferType(text: string): "income" | "expense" | null {
  const normalized = normalizeText(text)

  const incomePatterns = [
    /cobr/,
    /venta/,
    /ingres/,
    /me pagaron/,
    /me transfirieron/,
    /deposit/,
    /recibi/,
    /recib[ií]/,
    /entro/,
    /entr[oó]/,
  ]

  const expensePatterns = [
    /pag/,
    /gast/,
    /egres/,
    /compre/,
    /compr[eé]/,
    /transferi/,
    /transfer[ií]/,
    /debito/,
    /debito/,
    /alquiler/,
    /sueldo/,
    /impuesto/,
    /proveedor/,
  ]

  if (incomePatterns.some((pattern) => pattern.test(normalized))) return "income"
  if (expensePatterns.some((pattern) => pattern.test(normalized))) return "expense"
  return null
}

function inferCategory(text: string, type: "income" | "expense") {
  const normalized = normalizeText(text)

  if (type === "income") {
    if (/factura|cliente|cobro|servicio/.test(normalized)) return "Cobro de cliente"
    if (/venta|tienda|local|producto/.test(normalized)) return "Ventas"
    return "Ingresos varios"
  }

  if (/alquiler|rent/.test(normalized)) return "Alquiler"
  if (/sueldo|nomina|empleado/.test(normalized)) return "Sueldos"
  if (/meta|ads|publicidad|marketing|instagram|facebook|google ads/.test(normalized)) return "Marketing"
  if (/afip|arca|impuesto|iva|ingresos brutos|monotributo/.test(normalized)) return "Impuestos"
  if (/aws|hosting|software|saas|licencia|openai|notion|slack|figma/.test(normalized)) return "Software"
  if (/proveedor|compra|mercaderia|insumo|materia prima/.test(normalized)) return "Proveedores"
  if (/luz|agua|gas|internet|telefono/.test(normalized)) return "Servicios"
  if (/uber|taxi|combustible|nafta|envio|flete/.test(normalized)) return "Transporte"
  return "Gastos varios"
}

function buildDescription(text: string) {
  const clean = text.trim().replace(/\s+/g, " ")
  return clean.length <= 140 ? clean : `${clean.slice(0, 137)}...`
}

function parseMovementFromText(text: string): ParsedMovement | null {
  const amount = parseAmount(text)
  const type = inferType(text)

  if (!amount || !type) {
    return null
  }

  return {
    amount,
    type,
    category: inferCategory(text, type),
    description: buildDescription(text),
  }
}

async function resolveTelegramFileUrl(fileId: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new BadRequestException("Missing TELEGRAM_BOT_TOKEN", "Falta configurar el bot de Telegram.")
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
  if (!response.ok) {
    throw new Error(`Telegram getFile failed with ${response.status}`)
  }

  const body = await response.json() as { ok?: boolean; result?: { file_path?: string } }
  const filePath = body.result?.file_path
  if (!body.ok || !filePath) {
    throw new Error("Telegram no devolvió el archivo de audio.")
  }

  return `https://api.telegram.org/file/bot${botToken}/${filePath}`
}

async function transcribeAudioFromTelegram(fileId: string, mimeType?: string) {
  const openAiKey = process.env.OPENAI_API_KEY
  if (!openAiKey) {
    throw new BadRequestException("Missing OPENAI_API_KEY", "Falta configurar la transcripción de audio.")
  }

  const fileUrl = await resolveTelegramFileUrl(fileId)
  const audioResponse = await fetch(fileUrl)
  if (!audioResponse.ok) {
    throw new Error(`No se pudo descargar el audio de Telegram (${audioResponse.status}).`)
  }

  const audioBuffer = await audioResponse.arrayBuffer()
  const form = new FormData()
  form.append("model", "whisper-1")
  form.append("language", "es")
  form.append("file", new Blob([audioBuffer], { type: mimeType ?? "audio/ogg" }), "telegram-audio.ogg")

  const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
    },
    body: form,
  })

  if (!transcriptionResponse.ok) {
    const errorText = await transcriptionResponse.text()
    throw new Error(`La transcripción falló: ${errorText}`)
  }

  const transcription = await transcriptionResponse.json() as { text?: string }
  return transcription.text?.trim() ?? ""
}

async function sendTelegramMessage(chatId: string | number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  }).catch(() => undefined)
}

export class TelegramIntakeService {
  private parseChatMap() {
    const raw = process.env.TELEGRAM_CHAT_USER_MAP
    if (!raw) return {}

    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === "object" ? parsed as Record<string, string> : {}
    } catch {
      return {}
    }
  }

  private async resolveUser(chatId: string) {
    const configuredUserId = process.env.TELEGRAM_DEFAULT_USER_ID?.trim()
    const configuredEmail = process.env.TELEGRAM_DEFAULT_USER_EMAIL?.trim().toLowerCase()
    const chatMap = this.parseChatMap()
    const mappedUserId = chatMap[chatId]

    if (mappedUserId) {
      const { data } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("id", mappedUserId)
        .maybeSingle()

      if (data) {
        return data as ResolvedUser
      }
    }

    if (configuredUserId) {
      const { data } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("id", configuredUserId)
        .single()

      return data as ResolvedUser
    }

    if (configuredEmail) {
      const { data } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("email", configuredEmail)
        .single()

      return data as ResolvedUser
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .limit(2)

    if (error) {
      throw new Error(error.message)
    }

    if ((data ?? []).length === 1) {
      return data![0] as ResolvedUser
    }

    throw new BadRequestException(
      "Telegram user mapping is missing",
      "No pudimos saber a qué usuario cargarle este mensaje de Telegram.",
    )
  }

  private async findExistingLog(userId: string, sourceReference: string) {
    const { data, error } = await supabaseAdmin
      .from("intake_logs")
      .select("id, created_transactions, status")
      .eq("user_id", userId)
      .eq("source", "telegram")
      .eq("source_reference", sourceReference)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async processUpdate(update: TelegramUpdate) {
    const message = extractMessage(update)
    if (!message) {
      return {
        status: "ignored" as const,
        message: "Update sin mensaje utilizable.",
      }
    }

    const chatId = String(message.chat?.id ?? "")
    if (!chatId) {
      throw new BadRequestException("Missing Telegram chat id", "Telegram no envió un chat válido.")
    }

    const user = await this.resolveUser(chatId)
    const sourceReference = `telegram:${chatId}:${message.message_id}`
    const existing = await this.findExistingLog(user.id, sourceReference)

    if (existing?.status === "processed") {
      return {
        status: "duplicate" as const,
        message: "Este mensaje ya fue procesado.",
        transactionId: existing.created_transactions?.[0] ?? null,
      }
    }

    let rawText = message.text?.trim() || message.caption?.trim() || ""
    let transcription: string | null = null

    if (!rawText && message.voice?.file_id) {
      transcription = await transcribeAudioFromTelegram(message.voice.file_id, message.voice.mime_type)
      rawText = transcription
    } else if (!rawText && message.audio?.file_id) {
      transcription = await transcribeAudioFromTelegram(message.audio.file_id, message.audio.mime_type)
      rawText = transcription
    } else if (!rawText && message.document?.file_id && message.document.mime_type?.startsWith("audio/")) {
      transcription = await transcribeAudioFromTelegram(message.document.file_id, message.document.mime_type)
      rawText = transcription
    }

    if (!rawText) {
      await supabaseAdmin.from("intake_logs").insert({
        user_id: user.id,
        source: "telegram",
        status: "failed",
        source_reference: sourceReference,
        raw_content: JSON.stringify(update),
        processed_content: {
          kind: "telegram_message",
          error: "No text or audio transcription available",
        } as Json,
        processed_at: new Date().toISOString(),
        error_message: "No pudimos leer texto ni transcribir audio desde Telegram.",
      })

      await sendTelegramMessage(chatId, "No pude leer ese mensaje. Probá enviando texto o configurá la transcripción de audio.")

      return {
        status: "failed" as const,
        message: "No se pudo extraer texto del mensaje.",
      }
    }

    const parsedMovement = parseMovementFromText(rawText)
    const processedContent = {
      kind: "telegram_message",
      text: rawText,
      transcription,
      parsedMovement,
      telegram: {
        chatId,
        messageId: message.message_id,
        fromId: message.from?.id ?? null,
        username: message.from?.username ?? null,
      },
    } satisfies Json

    if (!parsedMovement) {
      await supabaseAdmin.from("intake_logs").insert({
        user_id: user.id,
        source: "telegram",
        status: "failed",
        source_reference: sourceReference,
        raw_content: JSON.stringify(update),
        processed_content: processedContent,
        processed_at: new Date().toISOString(),
        error_message: "No se pudo inferir monto o tipo del movimiento.",
      })

      await sendTelegramMessage(
        chatId,
        "Te entendí el mensaje, pero no pude sacar monto y tipo. Probá algo como: 'Cobré 120000 de cliente X' o 'Pagué 45000 de alquiler'.",
      )

      return {
        status: "failed" as const,
        message: "No se pudo inferir un movimiento desde el texto.",
      }
    }

    const createdLog = await supabaseAdmin
      .from("intake_logs")
      .insert({
        user_id: user.id,
        source: "telegram",
        status: "pending",
        source_reference: sourceReference,
        raw_content: JSON.stringify(update),
        processed_content: processedContent,
      })
      .select("id")
      .single()

    if (createdLog.error || !createdLog.data) {
      throw new Error(createdLog.error?.message ?? "No se pudo crear el intake log de Telegram.")
    }

    const transactionInsert = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: parsedMovement.type,
        amount: parsedMovement.amount,
        description: parsedMovement.description,
        counterparty: message.from?.username ?? message.from?.first_name ?? null,
        date: toISODateFromUnix(message.date),
        source: "telegram",
        status: "detected",
        category_id: null,
        invoice_id: null,
        notes: parsedMovement.notes ?? rawText,
        suggested_category: parsedMovement.category,
        recurring: false,
        source_data: {
          intakeLogId: createdLog.data.id,
          channel: "telegram",
          originalText: rawText,
          transcription,
          telegramChatId: chatId,
          telegramMessageId: message.message_id,
        } as Json,
      })
      .select("id")
      .single()

    if (transactionInsert.error || !transactionInsert.data) {
      await supabaseAdmin
        .from("intake_logs")
        .update({
          status: "failed",
          processed_at: new Date().toISOString(),
          error_message: transactionInsert.error?.message ?? "No se pudo insertar la transacción.",
        })
        .eq("id", createdLog.data.id)

      throw new Error(transactionInsert.error?.message ?? "No se pudo insertar la transacción desde Telegram.")
    }

    await supabaseAdmin
      .from("intake_logs")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        created_transactions: [transactionInsert.data.id],
        error_message: null,
      })
      .eq("id", createdLog.data.id)

    const actionLabel = parsedMovement.type === "income" ? "ingreso" : "gasto"
    await sendTelegramMessage(
      chatId,
      `Listo. Registré un ${actionLabel} por $${parsedMovement.amount.toLocaleString("es-AR")} y quedó para revisar en Syncro.`,
    )

    return {
      status: "processed" as const,
      message: "Mensaje de Telegram procesado correctamente.",
      transactionId: transactionInsert.data.id,
    }
  }
}
