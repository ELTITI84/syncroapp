import { z } from "zod"

export const updateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  issueDate: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  owner: z.string().min(1).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["paid", "pending", "overdue"]).optional(),
})

export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>
