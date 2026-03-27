import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { InsightsService } from "@/services/insights/insights.service"
import { insightsQuerySchema } from "@/types/insights/dto/insights-query.dto"

const insightsService = new InsightsService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = insightsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para insights.")
    }

    return insightsService.getInsights()
  })
}
