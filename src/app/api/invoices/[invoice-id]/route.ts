import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { InvoicesService } from "@/services/invoices/invoices.service"
import { invoiceIdParamSchema } from "@/types/invoices/dto/invoice-id-param.dto"
import { updateInvoiceSchema } from "@/types/invoices/dto/update-invoice.dto"

const invoicesService = new InvoicesService()

export async function GET(
  _request: Request,
  context: { params: Promise<{ "invoice-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = invoiceIdParamSchema.safeParse(params)

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para invoice.")
    }

    return invoicesService.getInvoiceById(parsedParams.data["invoice-id"])
  })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ "invoice-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = invoiceIdParamSchema.safeParse(params)
    const parsedBody = updateInvoiceSchema.safeParse(await request.json())

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para invoice.")
    }

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para actualizar factura.")
    }

    return invoicesService.updateInvoice(parsedParams.data["invoice-id"], parsedBody.data)
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ "invoice-id": string }> },
) {
  return routeHandler(async () => {
    const params = await context.params
    const parsedParams = invoiceIdParamSchema.safeParse(params)

    if (!parsedParams.success) {
      throw new ValidationException(parsedParams.error.message, "Parámetros inválidos para invoice.")
    }

    return invoicesService.deleteInvoice(parsedParams.data["invoice-id"])
  })
}
