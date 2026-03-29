import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { MercadoPagoService } from "@/services/mercadopago/mercadopago.service"
import { mpMovementsQuerySchema } from "@/types/mercadopago/dto/connect-mp.dto"

export const runtime = "nodejs"

const mpService = new MercadoPagoService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsed = mpMovementsQuerySchema.safeParse({
      period: searchParams.get("period") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    })

    if (!parsed.success) {
      throw new ValidationException(parsed.error.message, "Parámetros inválidos para consultar movimientos de MP.")
    }

    return mpService.getMovements(parsed.data)
  })
}
