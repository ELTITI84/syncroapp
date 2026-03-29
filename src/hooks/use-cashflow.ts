"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import type { CashflowMetrics, CashflowPoint, ForecastEvent } from "@/lib/syncro"

interface CashflowResponse {
  metrics: CashflowMetrics
  points: CashflowPoint[]
  forecastEvents: ForecastEvent[]
  baseline?: {
    metrics: CashflowMetrics
    points: CashflowPoint[]
  }
}

export function useCashflow(scenario?: {
  collectOverdue?: boolean
  delaySupplier?: boolean
  trimSaas?: boolean
  includeBaseline?: boolean
}) {
  const params = new URLSearchParams()
  if (scenario?.collectOverdue) params.set("collectOverdue", "true")
  if (scenario?.delaySupplier) params.set("delaySupplier", "true")
  if (scenario?.trimSaas) params.set("trimSaas", "true")
  if (scenario?.includeBaseline) params.set("includeBaseline", "true")

  const key = `/api/cashflow${params.toString() ? `?${params}` : ""}`

  const { data, error, isLoading } = useSWR<CashflowResponse>(
    key,
    (url: string) => apiFetch<CashflowResponse>(url),
  )

  return {
    metrics: data?.metrics ?? null,
    points: data?.points ?? [],
    forecastEvents: data?.forecastEvents ?? [],
    baseline: data?.baseline ?? null,
    isLoading,
    error,
  }
}
