import { z } from "zod"

export const updateTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).optional(),
  source: z.enum(["manual", "email", "bank", "invoice", "import", "telegram", "gmail"]).optional(),
  status: z.enum(["confirmed", "pending_review", "duplicate", "detected"]).optional(),
  suggestedCategory: z.string().optional(),
  notes: z.string().optional(),
  invoiceId: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  sourceData: z.unknown().optional(),
})

export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>
