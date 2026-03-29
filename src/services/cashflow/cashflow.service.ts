import { CashflowRepository } from "@/repositories/cashflow/cashflow.repository"
import {
  buildCashflowSeries,
  buildForecastEvents,
  getCashflowMetrics,
  type ScenarioState,
} from "@/lib/syncro"

export class CashflowService {
  constructor(private readonly cashflowRepository = new CashflowRepository()) {}

  async getCashflow(query: {
    collectOverdue?: boolean
    delaySupplier?: boolean
    trimSaas?: boolean
    includeBaseline?: boolean
  }) {
    const [invoices, transactions, scheduledEvents] = await Promise.all([
      this.cashflowRepository.getInvoices(),
      this.cashflowRepository.getTransactions(),
      this.cashflowRepository.getScheduledCashEvents(),
    ])

    const scenario: ScenarioState = {
      collect_overdue: Boolean(query.collectOverdue),
      delay_supplier: Boolean(query.delaySupplier),
      trim_saas: Boolean(query.trimSaas),
    }

    const points = buildCashflowSeries(invoices, transactions, scheduledEvents, scenario)
    const metrics = getCashflowMetrics(points, transactions)
    const baselinePoints = query.includeBaseline
      ? buildCashflowSeries(invoices, transactions, scheduledEvents)
      : null

    return {
      metrics,
      points,
      forecastEvents: buildForecastEvents(invoices, scheduledEvents, scenario),
      baseline: baselinePoints
        ? {
            metrics: getCashflowMetrics(baselinePoints, transactions),
            points: baselinePoints,
          }
        : undefined,
    }
  }
}
