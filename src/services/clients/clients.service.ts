import { ClientNotFoundException } from "@/exceptions/clients/clients-exceptions"
import { getClientRecords } from "@/lib/syncro"
import { ClientsRepository } from "@/repositories/clients/clients.repository"

export class ClientsService {
  constructor(private readonly clientsRepository = new ClientsRepository()) {}

  async getClients() {
    const invoices = await this.clientsRepository.getInvoices()
    return {
      clients: getClientRecords(invoices),
    }
  }

  async getClientById(clientId: string) {
    const result = await this.getClients()
    const client = result.clients.find((item) => item.id === clientId)

    if (!client) {
      throw new ClientNotFoundException(clientId)
    }

    return client
  }
}
