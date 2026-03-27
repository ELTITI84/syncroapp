import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { MovementsService } from "@/services/movements/movements.service"
import { createMovementSchema } from "@/types/movements/dto/create-movement.dto"
import { movementsQuerySchema } from "@/types/movements/dto/movements-query.dto"

const movementsService = new MovementsService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = movementsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para movements.")
    }

    return movementsService.getMovements(parsedQuery.data)
  })
}

export async function POST(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsedBody = createMovementSchema.safeParse(body)

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para crear movimiento.")
    }

    return movementsService.createMovement(parsedBody.data)
  })
}
