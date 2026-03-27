import type { Invoice } from "@/lib/data"
import {
  deleteMockInvoice,
  getMockInvoiceById,
  listMockClients,
  listMockInvoices,
  saveMockInvoice,
  updateMockInvoice,
} from "@/repositories/mock/mock-state"

export class InvoicesRepository {
  async getInvoices() {
    return listMockInvoices()
  }

  async getInvoiceById(invoiceId: string) {
    return getMockInvoiceById(invoiceId)
  }

  async getClients() {
    return listMockClients()
  }

  async createInvoice(invoice: Invoice) {
    return saveMockInvoice(invoice)
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>) {
    return updateMockInvoice(invoiceId, updates)
  }

  async deleteInvoice(invoiceId: string) {
    return deleteMockInvoice(invoiceId)
  }
}
