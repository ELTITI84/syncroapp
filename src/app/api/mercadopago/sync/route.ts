import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { MercadoPagoService } from "@/services/mercadopago/mercadopago.service"
import { mpSyncSchema } from "@/types/mercadopago/dto/connect-mp.dto"

export const runtime = "nodejs"

const mpService = new MercadoPagoService()

export async function POST(request: Request) {
  return routeHandler(async () => {
    const parsed = mpSyncSchema.safeParse(await request.json().catch(() => ({})))

    if (!parsed.success) {
      throw new ValidationException(parsed.error.message, "Parámetros inválidos para sincronizar Mercado Pago.")
    }

    return mpService.syncMovements(parsed.data.period)
  })
}
