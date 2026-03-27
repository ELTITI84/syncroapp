import type { Invoice } from "@/lib/data"
import type { InvoiceFilter } from "@/lib/syncro"

export type InvoiceModel = Invoice
export type InvoiceStatusFilter = InvoiceFilter

export type InvoicesListResult = {
  invoices: InvoiceModel[]
}
