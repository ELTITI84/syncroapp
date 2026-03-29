import { z } from "zod"

export const transactionsQuerySchema = z.object({
  tab: z.enum(["confirmed", "pending_review", "duplicate"]).optional(),
  category: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  source: z.enum(["manual", "email", "bank", "invoice", "import", "telegram", "gmail"]).optional(),
  quickFilter: z.enum(["all", "uncategorized", "imported", "detected", "linked_invoice"]).optional(),
  dateWindow: z.enum(["all", "last-7", "last-30"]).optional(),
  search: z.string().optional(),
  highlight: z.string().optional(),
})

export type TransactionsQueryDto = z.infer<typeof transactionsQuerySchema>
