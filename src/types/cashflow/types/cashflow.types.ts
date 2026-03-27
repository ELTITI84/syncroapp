import type { CashflowMetrics, CashflowPoint, ForecastEvent } from "@/lib/syncro"

export type CashflowResult = {
  metrics: CashflowMetrics
  points: CashflowPoint[]
  forecastEvents: ForecastEvent[]
}
