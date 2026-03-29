import { ClientNotFoundException } from "@/exceptions/clients/clients-exceptions"
import { getClientRecords } from "@/lib/syncro"
import { ClientsRepository } from "@/repositories/clients/clients.repository"

export class ClientsService {
  constructor(private readonly clientsRepository = new ClientsRepository()) {}

  async getClients() {
    const [clients, invoices] = await Promise.all([
      this.clientsRepository.getClients(),
      this.clientsRepository.getInvoices(),
    ])
    return {
      clients: getClientRecords(clients, invoices),
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
