import {
  clients as seedClients,
  insights as seedInsights,
  invoices as seedInvoices,
  notifications as seedNotifications,
  scheduledCashEvents as seedScheduledCashEvents,
  transactions as seedTransactions,
  type Client,
  type Insight,
  type Invoice,
  type NotificationItem,
  type ScheduledCashEvent,
  type Transaction,
} from "@/lib/data"

type MockState = {
  clients: Client[]
  invoices: Invoice[]
  insights: Insight[]
  notifications: NotificationItem[]
  scheduledCashEvents: ScheduledCashEvent[]
  transactions: Transaction[]
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const state: MockState = {
  clients: clone(seedClients),
  invoices: clone(seedInvoices),
  insights: clone(seedInsights),
  notifications: clone(seedNotifications),
  scheduledCashEvents: clone(seedScheduledCashEvents),
  transactions: clone(seedTransactions),
}

export function listMockClients() {
  return state.clients
}

export function listMockInvoices() {
  return state.invoices
}

export function getMockInvoiceById(invoiceId: string) {
  return state.invoices.find((invoice) => invoice.id === invoiceId) ?? null
}

export function saveMockInvoice(invoice: Invoice) {
  state.invoices = [invoice, ...state.invoices]
  return invoice
}

export function updateMockInvoice(invoiceId: string, updates: Partial<Invoice>) {
  let updatedInvoice: Invoice | null = null

  state.invoices = state.invoices.map((invoice) => {
    if (invoice.id !== invoiceId) return invoice
    updatedInvoice = { ...invoice, ...updates }
    return updatedInvoice
  })

  return updatedInvoice
}

export function deleteMockInvoice(invoiceId: string) {
  const existing = getMockInvoiceById(invoiceId)
  state.invoices = state.invoices.filter((invoice) => invoice.id !== invoiceId)
  return existing
}

export function listMockTransactions() {
  return state.transactions
}

export function getMockTransactionById(transactionId: string) {
  return state.transactions.find((transaction) => transaction.id === transactionId) ?? null
}

export function saveMockTransaction(transaction: Transaction) {
  state.transactions = [transaction, ...state.transactions]
  return transaction
}

export function updateMockTransaction(transactionId: string, updates: Partial<Transaction>) {
  let updatedTransaction: Transaction | null = null

  state.transactions = state.transactions.map((transaction) => {
    if (transaction.id !== transactionId) return transaction
    updatedTransaction = { ...transaction, ...updates }
    return updatedTransaction
  })

  return updatedTransaction
}

export function deleteMockTransaction(transactionId: string) {
  const existing = getMockTransactionById(transactionId)
  state.transactions = state.transactions.filter((transaction) => transaction.id !== transactionId)
  return existing
}

export function listMockInsights() {
  return state.insights
}

export function listMockNotifications() {
  return state.notifications
}

export function listMockScheduledCashEvents() {
  return state.scheduledCashEvents
}
