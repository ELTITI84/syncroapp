import { DashboardRepository } from "@/repositories/dashboard/dashboard.repository"
import { getCashflowMetrics, buildCashflowSeries, getTodayActions, getWhyReasons } from "@/lib/syncro"

export class DashboardService {
  constructor(private readonly dashboardRepository = new DashboardRepository()) {}

  async getDashboardOverview() {
    const [invoices, transactions, notifications] = await Promise.all([
      this.dashboardRepository.getInvoices(),
      this.dashboardRepository.getTransactions(),
      this.dashboardRepository.getNotifications(),
    ])

    const points = buildCashflowSeries(invoices, transactions)
    const metrics = getCashflowMetrics(points, transactions)
    const criticalWarning =
      metrics.daysUntilZero !== null
        ? `Cashflow projected to go negative in ${metrics.daysUntilZero} days.`
        : null

    return {
      criticalWarning,
      metrics,
      notifications,
      todayActions: getTodayActions(invoices, transactions, metrics),
      whyReasons: getWhyReasons(invoices, transactions, metrics),
    }
  }
}
