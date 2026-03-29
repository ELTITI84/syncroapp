import { InvoiceNotFoundException } from "@/exceptions/invoices/invoices-exceptions"
import type { Invoice } from "@/lib/data"
import { getInvoiceSummary, getInvoiceType, matchesInvoiceFilter } from "@/lib/syncro"
import { InvoicesRepository } from "@/repositories/invoices/invoices.repository"
import type { CreateInvoiceDto } from "@/types/invoices/dto/create-invoice.dto"
import type { InvoicesQueryDto } from "@/types/invoices/dto/invoices-query.dto"
import type { UpdateInvoiceDto } from "@/types/invoices/dto/update-invoice.dto"

export class InvoicesService {
  constructor(private readonly invoicesRepository = new InvoicesRepository()) {}

  async getInvoices(query: InvoicesQueryDto) {
    const invoices = await this.invoicesRepository.getInvoices()
    const search = query.search?.trim().toLowerCase()
    const filteredInvoices = invoices.filter((invoice) => {
      const matchesStatus = query.status ? matchesInvoiceFilter(invoice, query.status as never) : true
      const matchesType = query.type ? getInvoiceType(invoice) === query.type : true
      const matchesClient = query.client ? invoice.clientId === query.client : true
      const matchesSearch =
        !search ||
        invoice.id.toLowerCase().includes(search) ||
        invoice.client.toLowerCase().includes(search) ||
        invoice.description.toLowerCase().includes(search)

      return matchesStatus && matchesType && matchesClient && matchesSearch
    })

    return {
      invoices: filteredInvoices,
      groupedInvoices: {
        receivable: filteredInvoices.filter((invoice) => getInvoiceType(invoice) === "receivable"),
        payable: filteredInvoices.filter((invoice) => getInvoiceType(invoice) === "payable"),
      },
      metrics: getInvoiceSummary(filteredInvoices),
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
    const invoice: Invoice = {
      id: `INV-${String(Date.now()).slice(-6)}`,
      client: payload.clientId,
      clientId: payload.clientId,
      amount: payload.amount,
      totalAmount: payload.amount,
      paidAmount: 0,
      type: payload.type,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      status: "pending",
      description: payload.description,
      owner: payload.owner,
      priority: payload.priority,
      notes: payload.notes,
      paymentHistory: [],
      expectedPayments: [],
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
    await this.getInvoiceById(invoiceId)
    await this.invoicesRepository.deleteInvoice(invoiceId)
    return { success: true, invoiceId }
  }
}
