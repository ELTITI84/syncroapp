import { z } from "zod"

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["receivable", "payable"]).default("receivable"),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  description: z.string().min(1),
  owner: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  notes: z.string().optional(),
})

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>
