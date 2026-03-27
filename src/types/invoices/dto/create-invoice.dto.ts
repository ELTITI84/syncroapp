import { z } from "zod"

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  amount: z.number().positive(),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  description: z.string().min(1),
  owner: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
})

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>
