import { CashflowRepository } from "@/repositories/cashflow/cashflow.repository"
import { getExpenseBreakdown, getHealthScore, getTodayActions, buildCashflowSeries, getCashflowMetrics, getRuntimeInsights } from "@/lib/syncro"
import { InsightsRepository } from "@/repositories/insights/insights.repository"

export class InsightsService {
  constructor(
    private readonly insightsRepository = new InsightsRepository(),
    private readonly cashflowRepository = new CashflowRepository(),
  ) {}

  async getInsights() {
    const [storedInsights, invoices, transactions, scheduledEvents] = await Promise.all([
      this.insightsRepository.getInsights(),
      this.insightsRepository.getInvoices(),
      this.insightsRepository.getTransactions(),
      this.cashflowRepository.getScheduledCashEvents(),
    ])

    const series = buildCashflowSeries(invoices, transactions, scheduledEvents)
    const metrics = getCashflowMetrics(series, transactions)
    const runtimeInsights = getRuntimeInsights(invoices, transactions, metrics, scheduledEvents)
    const allowedPaths = new Set(["/invoices", "/movements", "/cashflow"])
    const storedAllowedInsights = storedInsights.filter((insight) => allowedPaths.has(insight.target.pathname))
    const insights = [...runtimeInsights, ...storedAllowedInsights].filter(
      (insight, index, collection) =>
        collection.findIndex((candidate) => candidate.title === insight.title) === index,
    )

    return {
      healthScore: getHealthScore(invoices, transactions, metrics),
      insights,
      expenseBreakdown: getExpenseBreakdown(transactions),
      todayActions: getTodayActions(invoices, transactions, metrics, scheduledEvents),
    }
  }
}
