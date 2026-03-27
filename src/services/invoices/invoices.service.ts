import { ValidationException } from "@/exceptions/base/base-exceptions"
import { InvoiceNotFoundException } from "@/exceptions/invoices/invoices-exceptions"
import type { Invoice } from "@/lib/data"
import { matchesInvoiceFilter } from "@/lib/syncro"
import { InvoicesRepository } from "@/repositories/invoices/invoices.repository"
import type { CreateInvoiceDto } from "@/types/invoices/dto/create-invoice.dto"
import type { InvoicesQueryDto } from "@/types/invoices/dto/invoices-query.dto"
import type { UpdateInvoiceDto } from "@/types/invoices/dto/update-invoice.dto"

export class InvoicesService {
  constructor(private readonly invoicesRepository = new InvoicesRepository()) {}

  async getInvoices(query: InvoicesQueryDto) {
    const invoices = await this.invoicesRepository.getInvoices()
    const search = query.search?.trim().toLowerCase()

    return {
      invoices: invoices.filter((invoice) => {
        const matchesStatus = query.status ? matchesInvoiceFilter(invoice, query.status as never) : true
        const matchesClient = query.client ? invoice.clientId === query.client : true
        const matchesSearch =
          !search ||
          invoice.id.toLowerCase().includes(search) ||
          invoice.client.toLowerCase().includes(search) ||
          invoice.description.toLowerCase().includes(search)

        return matchesStatus && matchesClient && matchesSearch
      }),
    }
  }

  async getInvoiceById(invoiceId: string) {
    const invoice = await this.invoicesRepository.getInvoiceById(invoiceId)

    if (!invoice) {
      throw new InvoiceNotFoundException(invoiceId)
    }

    return invoice
  }

  async createInvoice(payload: CreateInvoiceDto) {
    const clients = await this.invoicesRepository.getClients()
    const client = clients.find((item) => item.id === payload.clientId)

    if (!client) {
      throw new ValidationException("Client does not exist", "No pudimos encontrar ese cliente.")
    }

    const invoice: Invoice = {
      id: `INV-${String(Date.now()).slice(-6)}`,
      client: client.name,
      clientId: client.id,
      amount: payload.amount,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      status: "pending",
      description: payload.description,
      owner: payload.owner,
      priority: payload.priority,
      paymentHistory: [],
      expectedPayments: [
        {
          date: payload.dueDate,
          amount: payload.amount,
          note: "Expected on the invoice due date.",
        },
      ],
    }

    return this.invoicesRepository.createInvoice(invoice)
  }

  async updateInvoice(invoiceId: string, updates: UpdateInvoiceDto) {
    const currentInvoice = await this.getInvoiceById(invoiceId)
    const nextInvoice = await this.invoicesRepository.updateInvoice(invoiceId, updates)

    if (!nextInvoice) {
      throw new InvoiceNotFoundException(invoiceId)
    }

    if (updates.status === "paid" && currentInvoice.status !== "paid") {
      nextInvoice.expectedPayments = []
    }

    return nextInvoice
  }

  async deleteInvoice(invoiceId: string) {
    const deletedInvoice = await this.invoicesRepository.deleteInvoice(invoiceId)

    if (!deletedInvoice) {
      throw new InvoiceNotFoundException(invoiceId)
    }

    return { success: true, invoiceId }
  }
}
