import { DashboardService } from "@/services/dashboard/dashboard.service"
import { dashboardQuerySchema } from "@/types/dashboard/dto/dashboard-query.dto"
import { routeHandler } from "@/lib/handlers/route-handler"
import { ValidationException } from "@/exceptions/base/base-exceptions"

const dashboardService = new DashboardService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = dashboardQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para dashboard.")
    }

    return dashboardService.getDashboardOverview()
  }, { cacheSeconds: 60, staleWhileRevalidate: 120 })
}
