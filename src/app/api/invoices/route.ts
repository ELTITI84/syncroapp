import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { InvoicesService } from "@/services/invoices/invoices.service"
import { createInvoiceSchema } from "@/types/invoices/dto/create-invoice.dto"
import { invoicesQuerySchema } from "@/types/invoices/dto/invoices-query.dto"

const invoicesService = new InvoicesService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = invoicesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para invoices.")
    }

    return invoicesService.getInvoices(parsedQuery.data)
  })
}

export async function POST(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsedBody = createInvoiceSchema.safeParse(body)

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para crear factura.")
    }

    return invoicesService.createInvoice(parsedBody.data)
  })
}
