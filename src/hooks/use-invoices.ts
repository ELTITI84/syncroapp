"use client"

import useSWR from "swr"
import { useSWRConfig } from "swr"
import { apiFetch } from "@/lib/api"
import type { Invoice } from "@/lib/data"
import { isSyncroDataKey } from "@/lib/revalidate-syncro-data"
import type { InvoiceSummary } from "@/lib/syncro"

interface InvoicesResponse {
  invoices: Invoice[]
  groupedInvoices: {
    receivable: Invoice[]
    payable: Invoice[]
  }
  metrics: InvoiceSummary
}

const emptyMetrics: InvoiceSummary = {
  outstandingAmount: 0,
  overdueAmount: 0,
  dueSoonAmount: 0,
  paidAmount: 0,
  overdueCount: 0,
  dueSoonCount: 0,
  receivablesOutstanding: 0,
  payablesOutstanding: 0,
  overdueReceivables: 0,
  dueSoonPayables: 0,
}

export function useInvoices() {
  const { data, error, isLoading, mutate } = useSWR<InvoicesResponse>(
    "/api/invoices",
    (url: string) => apiFetch<InvoicesResponse>(url),
  )
  const { mutate: mutateGlobal } = useSWRConfig()

  const createInvoice = async (payload: {
    clientId: string
    amount: number
    type: "receivable" | "payable"
    issueDate: string
    dueDate: string
    description: string
    owner: string
    priority: "high" | "medium" | "low"
    notes?: string
  }) => {
    await apiFetch("/api/invoices", { method: "POST", body: JSON.stringify(payload) })
    await mutateGlobal(isSyncroDataKey, undefined, { revalidate: true })
  }

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    await apiFetch(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(updates) })
    await mutateGlobal(isSyncroDataKey, undefined, { revalidate: true })
  }

  const markInvoicePaid = async (invoice: Invoice) => {
    const totalAmount = invoice.totalAmount ?? invoice.amount
    const paidAmount = invoice.paidAmount ?? invoice.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingAmount = Math.max(totalAmount - paidAmount, 0)
    const invoiceType = invoice.type ?? "receivable"

    await apiFetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "paid", paidAmount: totalAmount }),
    })
    if (remainingAmount > 0) {
      const paidDate = new Date().toISOString().slice(0, 10)
      await apiFetch("/api/movements", {
        method: "POST",
        body: JSON.stringify({
          date: paidDate,
          description: invoiceType === "payable" ? `Pago a proveedor ${invoice.client}` : `Cobro de ${invoice.client}`,
          amount: remainingAmount,
          type: invoiceType === "payable" ? "expense" : "income",
          category: invoiceType === "payable" ? "Pago a proveedor" : "Cobro de factura",
          source: "invoice",
          invoiceId: invoice.id,
          sourceData: {
            linkedInvoiceId: invoice.id,
            linkedInvoiceType: invoiceType,
          },
        }),
      })
    }
    await mutateGlobal(isSyncroDataKey, undefined, { revalidate: true })
  }

  const deleteInvoice = async (id: string) => {
    await apiFetch(`/api/invoices/${id}`, { method: "DELETE" })
    await mutateGlobal(isSyncroDataKey, undefined, { revalidate: true })
  }

  return {
    invoices: data?.invoices ?? [],
    groupedInvoices: data?.groupedInvoices ?? { receivable: [], payable: [] },
    metrics: data?.metrics ?? emptyMetrics,
    isLoading,
    error,
    mutate,
    createInvoice,
    updateInvoice,
    markInvoicePaid,
    deleteInvoice,
  }
}
