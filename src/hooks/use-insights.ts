"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import type { Insight } from "@/lib/data"
import type { TodayAction } from "@/lib/syncro"

interface ExpenseBreakdownItem {
  category: string
  amount: number
  percentage: number
}

interface InsightsResponse {
  healthScore: number
  insights: Insight[]
  expenseBreakdown: ExpenseBreakdownItem[]
  todayActions: TodayAction[]
}

export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR<InsightsResponse>(
    "/api/insights",
    (url: string) => apiFetch<InsightsResponse>(url),
  )

  return {
    healthScore: data?.healthScore ?? 0,
    insights: data?.insights ?? [],
    expenseBreakdown: data?.expenseBreakdown ?? [],
    todayActions: data?.todayActions ?? [],
    isLoading,
    error,
    mutate,
  }
}
