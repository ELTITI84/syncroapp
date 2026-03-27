import {
  listMockInvoices,
  listMockNotifications,
  listMockTransactions,
} from "@/repositories/mock/mock-state"

export class DashboardRepository {
  async getInvoices() {
    return listMockInvoices()
  }

  async getTransactions() {
    return listMockTransactions()
  }

  async getNotifications() {
    return listMockNotifications()
  }
}
