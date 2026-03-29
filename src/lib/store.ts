"use client"

import { create } from "zustand"
import type { Invoice, Transaction } from "./data"
import { invoices as initialInvoices, transactions as initialTransactions } from "./data"

type AppState = {
  invoices: Invoice[]
  transactions: Transaction[]
  lastSync: Date
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  markInvoicePaid: (id: string) => void
  deleteInvoice: (id: string) => void
  addTransaction: (tx: Transaction) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  syncData: () => void
}

export const useStore = create<AppState>((set) => ({
  invoices: initialInvoices,
  transactions: initialTransactions,
  lastSync: new Date(),
  addInvoice: (invoice) =>
    set((state) => ({ invoices: [invoice, ...state.invoices] })),
  updateInvoice: (id, updates) =>
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
    })),
  markInvoicePaid: (id) =>
    set((state) => {
      const invoice = state.invoices.find((item) => item.id === id)

      if (!invoice || invoice.status === "paid") {
        return state
      }

      const paidDate = new Date().toISOString().slice(0, 10)
      const totalAmount = invoice.totalAmount ?? invoice.amount
      const collectedSoFar = invoice.paidAmount ?? invoice.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
      const remainingAmount = Math.max(totalAmount - collectedSoFar, 0)
      const note = invoice.paymentHistory.length > 0 ? "Se cobró el saldo pendiente" : "Se marcó como cobrada"
      const invoiceType = invoice.type ?? "receivable"

      return {
        invoices: state.invoices.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "paid",
                paidAmount: totalAmount,
                expectedPayments: [],
                paymentHistory: [
                  ...item.paymentHistory,
                  {
                    date: paidDate,
                    amount: remainingAmount,
                    note,
                  },
                ],
              }
            : item,
        ),
        transactions: [
          {
            id: `T${Date.now().toString().slice(-6)}`,
            date: paidDate,
            description: invoiceType === "payable" ? `Pago a proveedor ${invoice.client}` : `Cobro de ${invoice.client}`,
            amount: remainingAmount,
            type: invoiceType === "payable" ? "expense" : "income",
            category: invoiceType === "payable" ? "Pago a proveedor" : "Cobro de factura",
            source: "manual",
            status: "confirmed",
            clientId: invoice.clientId,
            invoiceId: invoice.id,
          },
          ...state.transactions,
        ],
      }
    }),
  deleteInvoice: (id) =>
    set((state) => ({ invoices: state.invoices.filter((inv) => inv.id !== id) })),
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTransaction: (id) =>
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),
  syncData: () => set({ lastSync: new Date() }),
}))
