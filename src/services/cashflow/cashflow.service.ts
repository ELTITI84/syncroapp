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
  }) {
    const [invoices, transactions] = await Promise.all([
      this.cashflowRepository.getInvoices(),
      this.cashflowRepository.getTransactions(),
    ])

    const scenario: ScenarioState = {
      collect_overdue: Boolean(query.collectOverdue),
      delay_supplier: Boolean(query.delaySupplier),
      trim_saas: Boolean(query.trimSaas),
    }

    const points = buildCashflowSeries(invoices, transactions, scenario)

    return {
      metrics: getCashflowMetrics(points, transactions),
      points,
      forecastEvents: buildForecastEvents(invoices, scenario),
    }
  }
}
