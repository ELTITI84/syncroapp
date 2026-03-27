import { NotFoundException } from "@/exceptions/base/base-exceptions"

export class InvoiceNotFoundException extends NotFoundException {
  constructor(invoiceId: string) {
    super(`Invoice ${invoiceId} not found`, "La factura solicitada no existe.")
  }
}
