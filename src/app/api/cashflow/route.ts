import { CashflowService } from "@/services/cashflow/cashflow.service"
import { cashflowQuerySchema } from "@/types/cashflow/dto/cashflow-query.dto"
import { routeHandler } from "@/lib/handlers/route-handler"
import { ValidationException } from "@/exceptions/base/base-exceptions"

const cashflowService = new CashflowService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = cashflowQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para cashflow.")
    }

    return cashflowService.getCashflow(parsedQuery.data)
  }, { cacheSeconds: 60, staleWhileRevalidate: 120 })
}
