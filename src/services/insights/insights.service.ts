import { getExpenseBreakdown, getInsights, getTodayActions, buildCashflowSeries, getCashflowMetrics } from "@/lib/syncro"
import { InsightsRepository } from "@/repositories/insights/insights.repository"

export class InsightsService {
  constructor(private readonly insightsRepository = new InsightsRepository()) {}

  async getInsights() {
    const [invoices, transactions] = await Promise.all([
      this.insightsRepository.getInvoices(),
      this.insightsRepository.getTransactions(),
    ])

    const insightsPayload = getInsights(invoices, transactions)
    const metrics = getCashflowMetrics(buildCashflowSeries(invoices, transactions), transactions)

    return {
      healthScore: insightsPayload.healthScore,
      insights: insightsPayload.insights,
      expenseBreakdown: getExpenseBreakdown(transactions),
      todayActions: getTodayActions(invoices, transactions, metrics),
    }
  }
}
