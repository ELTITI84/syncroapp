import type { NotificationItem } from "@/lib/data"
import type { CashflowMetrics, TodayAction, WhyReason } from "@/lib/syncro"

export type DashboardResult = {
  criticalWarning: string | null
  metrics: CashflowMetrics
  notifications: NotificationItem[]
  todayActions: TodayAction[]
  whyReasons: WhyReason[]
}
