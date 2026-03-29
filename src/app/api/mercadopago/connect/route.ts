import { routeHandler } from "@/lib/handlers/route-handler"
import { MercadoPagoService } from "@/services/mercadopago/mercadopago.service"

export const runtime = "nodejs"

const mpService = new MercadoPagoService()

export async function GET() {
  return routeHandler(async () => mpService.getConnectionStatus())
}

export async function DELETE() {
  return routeHandler(async () => {
    await mpService.disconnectAccount()
    return { success: true }
  })
}
