"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import type { Insight, NotificationItem } from "@/lib/data"
import type { CashflowMetrics, CashflowPoint, TodayAction, WhyReason } from "@/lib/syncro"

interface ExpenseBreakdownItem {
  category: string
  amount: number
  percentage: number
}

interface DashboardResponse {
  cashCollected: number
  amountToCollect: number
  amountToPay: number
  monthlyNetResult: number
  criticalWarning: string | null
  metrics: CashflowMetrics
  points: CashflowPoint[]
  notifications: NotificationItem[]
  todayActions: TodayAction[]
  whyReasons: WhyReason[]
  healthScore: number
  insights: Insight[]
  expenseBreakdown: ExpenseBreakdownItem[]
}

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    "/api/dashboard",
    (url: string) => apiFetch<DashboardResponse>(url),
  )

  return {
    cashCollected: data?.cashCollected ?? 0,
    amountToCollect: data?.amountToCollect ?? 0,
    amountToPay: data?.amountToPay ?? 0,
    monthlyNetResult: data?.monthlyNetResult ?? 0,
    criticalWarning: data?.criticalWarning ?? null,
    metrics: data?.metrics ?? null,
    points: data?.points ?? [],
    notifications: data?.notifications ?? [],
    todayActions: data?.todayActions ?? [],
    whyReasons: data?.whyReasons ?? [],
    healthScore: data?.healthScore ?? 0,
    insights: data?.insights ?? [],
    expenseBreakdown: data?.expenseBreakdown ?? [],
    isLoading,
    error,
    mutate,
  }
}
