import { z } from "zod"

export const createTransactionSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  source: z.enum(["manual", "email", "bank", "invoice", "import", "telegram", "gmail"]).default("manual"),
  notes: z.string().optional(),
  invoiceId: z.string().optional(),
  sourceData: z.unknown().optional(),
})

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>
