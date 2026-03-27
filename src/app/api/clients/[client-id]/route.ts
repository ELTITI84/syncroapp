import { ClientsService } from "@/services/clients/clients.service"
import { clientIdParamSchema } from "@/types/clients/dto/client-id-param.dto"
import { routeHandler } from "@/lib/handlers/route-handler"
import { ValidationException } from "@/exceptions/base/base-exceptions"

const clientsService = new ClientsService()

export async function GET(
  _request: Request,
  context: { params: Promise<{ "client-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = clientIdParamSchema.safeParse(params)

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para client.")
    }

    return clientsService.getClientById(parsedParams.data["client-id"])
  })
}
