import { DashboardRepository } from "@/repositories/dashboard/dashboard.repository"
import { CashflowRepository } from "@/repositories/cashflow/cashflow.repository"
import { InsightsRepository } from "@/repositories/insights/insights.repository"
import { isSameMonth, parseISO } from "date-fns"
import {
  buildCashflowSeries,
  getCashflowMetrics,
  getExpenseBreakdown,
  getHealthScore,
  getInvoiceOutstandingAmount,
  getInvoiceType,
  getTodayActions,
  getWhyReasons,
} from "@/lib/syncro"

export class DashboardService {
  constructor(
    private readonly dashboardRepository = new DashboardRepository(),
    private readonly cashflowRepository = new CashflowRepository(),
    private readonly insightsRepository = new InsightsRepository(),
  ) {}

  async getDashboardOverview() {
    const [invoices, transactions, notifications, scheduledEvents, insights] = await Promise.all([
      this.dashboardRepository.getInvoices(),
      this.dashboardRepository.getTransactions(),
      this.dashboardRepository.getNotifications(),
      this.cashflowRepository.getScheduledCashEvents(),
      this.insightsRepository.getInsights(),
    ])

    const points = buildCashflowSeries(invoices, transactions, scheduledEvents)
    const metrics = getCashflowMetrics(points, transactions)
    const now = new Date()
    const confirmedTransactionsThisMonth = transactions.filter(
      (transaction) =>
        transaction.status === "confirmed" &&
        isSameMonth(parseISO(transaction.date), now),
    )
    const cashCollected = confirmedTransactionsThisMonth
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const confirmedExpensesThisMonth = confirmedTransactionsThisMonth
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const amountToCollect = invoices
      .filter((invoice) => getInvoiceType(invoice) === "receivable" && getInvoiceOutstandingAmount(invoice) > 0)
      .reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0)
    const amountToPay = invoices
      .filter((invoice) => getInvoiceType(invoice) === "payable" && getInvoiceOutstandingAmount(invoice) > 0)
      .reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0)
    const monthlyNetResult = cashCollected - confirmedExpensesThisMonth
    const criticalWarning =
      metrics.daysUntilZero !== null
        ? `Si no cambia nada, la caja va a negativo en ${metrics.daysUntilZero} días.`
        : null

    return {
      cashCollected,
      amountToCollect,
      amountToPay,
      monthlyNetResult,
      criticalWarning,
      metrics,
      points,
      notifications,
      todayActions: getTodayActions(invoices, transactions, metrics, scheduledEvents),
      whyReasons: getWhyReasons(invoices, transactions, metrics, scheduledEvents),
      healthScore: getHealthScore(invoices, transactions, metrics),
      insights,
      expenseBreakdown: getExpenseBreakdown(transactions),
    }
  }
}
