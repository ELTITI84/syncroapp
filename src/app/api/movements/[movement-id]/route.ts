import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { TransactionsService } from "@/services/movements/movements.service"
import { transactionIdParamSchema } from "@/types/movements/dto/movement-id-param.dto"
import { updateTransactionSchema } from "@/types/movements/dto/update-movement.dto"

const transactionsService = new TransactionsService()

export async function GET(
  _request: Request,
  context: { params: Promise<{ "movement-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = transactionIdParamSchema.safeParse(params)

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para transacción.")
    }

    return transactionsService.getTransactionById(parsedParams.data["movement-id"])
  })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ "movement-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = transactionIdParamSchema.safeParse(params)
    const parsedBody = updateTransactionSchema.safeParse(await request.json())

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para transacción.")
    }

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para actualizar transacción.")
    }

    return transactionsService.updateTransaction(parsedParams.data["movement-id"], parsedBody.data)
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ "movement-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = transactionIdParamSchema.safeParse(params)

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para transacción.")
    }

    return transactionsService.deleteTransaction(parsedParams.data["movement-id"])
  })
}
