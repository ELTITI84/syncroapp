import type { Insight } from "@/lib/data"
import type { TodayAction } from "@/lib/syncro"

export type InsightsResult = {
  healthScore: number
  insights: Insight[]
  expenseBreakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  todayActions: TodayAction[]
}
