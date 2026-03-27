import { z } from "zod"

export const movementsQuerySchema = z.object({
  tab: z.enum(["confirmed", "pending", "duplicate"]).optional(),
  category: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  source: z.enum(["manual", "email", "bank"]).optional(),
  dateWindow: z.enum(["all", "last-7", "last-30"]).optional(),
  search: z.string().optional(),
  highlight: z.string().optional(),
})

export type MovementsQueryDto = z.infer<typeof movementsQuerySchema>
