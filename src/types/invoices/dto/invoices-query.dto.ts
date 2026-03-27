import { z } from "zod"

export const invoicesQuerySchema = z.object({
  status: z.enum(["all", "overdue", "due-soon", "expected", "pending", "paid"]).optional(),
  client: z.string().optional(),
  search: z.string().optional(),
  highlight: z.string().optional(),
})

export type InvoicesQueryDto = z.infer<typeof invoicesQuerySchema>
