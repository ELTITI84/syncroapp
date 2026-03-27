import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { MovementsService } from "@/services/movements/movements.service"
import { movementIdParamSchema } from "@/types/movements/dto/movement-id-param.dto"
import { updateMovementSchema } from "@/types/movements/dto/update-movement.dto"

const movementsService = new MovementsService()

export async function GET(
  _request: Request,
  context: { params: Promise<{ "movement-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = movementIdParamSchema.safeParse(params)

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para movement.")
    }

    return movementsService.getMovementById(parsedParams.data["movement-id"])
  })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ "movement-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = movementIdParamSchema.safeParse(params)
    const parsedBody = updateMovementSchema.safeParse(await request.json())

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para movement.")
    }

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para actualizar movimiento.")
    }

    return movementsService.updateMovement(parsedParams.data["movement-id"], parsedBody.data)
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ "movement-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = movementIdParamSchema.safeParse(params)

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para movement.")
    }

    return movementsService.deleteMovement(parsedParams.data["movement-id"])
  })
}
