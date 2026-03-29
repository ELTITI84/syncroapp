"use client"

import useSWR from "swr"
import { useSWRConfig } from "swr"
import { apiFetch } from "@/lib/api"
import type { Transaction } from "@/lib/data"
import { isSyncroDataKey } from "@/lib/revalidate-syncro-data"

interface TransactionsResponse {
  transactions: Transaction[]
}

export function useTransactions() {
  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    "/api/movements",
    (url: string) => apiFetch<TransactionsResponse>(url),
  )
  const { mutate: mutateGlobal } = useSWRConfig()

  const createTransaction = async (payload: {
    date: string
    description: string
    amount: number
    type: "income" | "expense"
    category: string
    source: Transaction["source"]
    notes?: string
    invoiceId?: string
    sourceData?: unknown
  }) => {
    await apiFetch("/api/movements", { method: "POST", body: JSON.stringify(payload) })
    await mutateGlobal(isSyncroDataKey, undefined, { revalidate: true })
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await apiFetch(`/api/movements/${id}`, { method: "PATCH", body: JSON.stringify(updates) })
    await mutateGlobal(isSyncroDataKey, undefined, { revalidate: true })
  }

  const deleteTransaction = async (id: string) => {
    await apiFetch(`/api/movements/${id}`, { method: "DELETE" })
    await mutateGlobal(isSyncroDataKey, undefined, { revalidate: true })
  }

  return {
    transactions: data?.transactions ?? [],
    isLoading,
    error,
    mutate,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
