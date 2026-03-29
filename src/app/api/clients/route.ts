import { ClientsService } from "@/services/clients/clients.service"
import { clientsQuerySchema } from "@/types/clients/dto/clients-query.dto"
import { routeHandler } from "@/lib/handlers/route-handler"
import { ValidationException } from "@/exceptions/base/base-exceptions"

const clientsService = new ClientsService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = clientsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para clients.")
    }

    return clientsService.getClients()
  }, { cacheSeconds: 120, staleWhileRevalidate: 240 })
}
