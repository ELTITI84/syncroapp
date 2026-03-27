import { listMockClients, listMockInvoices } from "@/repositories/mock/mock-state"

export class ClientsRepository {
  async getClients() {
    return listMockClients()
  }

  async getInvoices() {
    return listMockInvoices()
  }
}
