import {
  listMockInsights,
  listMockInvoices,
  listMockTransactions,
} from "@/repositories/mock/mock-state"

export class InsightsRepository {
  async getInsights() {
    return listMockInsights()
  }

  async getInvoices() {
    return listMockInvoices()
  }

  async getTransactions() {
    return listMockTransactions()
  }
}
