import { z } from "zod"

export const invoiceIdParamSchema = z.object({
  "invoice-id": z.string().min(1),
})

export type InvoiceIdParamDto = z.infer<typeof invoiceIdParamSchema>
