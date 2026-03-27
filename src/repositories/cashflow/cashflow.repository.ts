import {
  listMockInvoices,
  listMockScheduledCashEvents,
  listMockTransactions,
} from "@/repositories/mock/mock-state"

export class CashflowRepository {
  async getInvoices() {
    return listMockInvoices()
  }

  async getTransactions() {
    return listMockTransactions()
  }

  async getScheduledCashEvents() {
    return listMockScheduledCashEvents()
  }
}
