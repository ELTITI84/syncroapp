import type { Client } from "@/lib/data"
import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import { dbRowToInvoice } from "@/repositories/base/row-mappers"

function buildClientsFromCounterparties(names: string[]): Client[] {
  const seen = new Set<string>()
  const clients: Client[] = []

  for (const name of names) {
    if (!name || seen.has(name)) continue
    seen.add(name)
    clients.push({
      id: name,
      name,
      industry: "General",
      riskScore: "medium",
      avgPaymentDays: 30,
      paymentTerms: "Net 30",
    })
  }

  return clients
}

export class ClientsRepository extends AuthenticatedRepository {
  async getClients() {
    const invoiceRows = await this.fetchAllRows<{ counterparty: string }>("invoices", "counterparty")
    const transactionRows = await this.fetchAllRows<{ counterparty: string }>("transactions", "counterparty")

    const names = [
      ...invoiceRows.map((r) => r.counterparty).filter(Boolean),
      ...transactionRows.map((r) => r.counterparty).filter(Boolean),
    ] as string[]

    return buildClientsFromCounterparties(names)
  }

  async getInvoices() {
    const data = await this.fetchAllRows("invoices", "*", {
      orderBy: "created_at",
      ascending: false,
    })
    return data.map(dbRowToInvoice)
  }
}
