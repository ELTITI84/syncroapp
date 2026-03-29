import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { TransactionsService } from "@/services/movements/movements.service"
import { createTransactionSchema } from "@/types/movements/dto/create-movement.dto"
import { transactionsQuerySchema } from "@/types/movements/dto/movements-query.dto"

const transactionsService = new TransactionsService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = transactionsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para transacciones.")
    }

    return transactionsService.getTransactions(parsedQuery.data)
  }, { cacheSeconds: 30, staleWhileRevalidate: 60 })
}

export async function POST(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsedBody = createTransactionSchema.safeParse(body)

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para crear transacción.")
    }

    return transactionsService.createTransaction(parsedBody.data)
  })
}
