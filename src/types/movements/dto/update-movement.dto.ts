import { z } from "zod"

export const updateMovementSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).optional(),
  source: z.enum(["manual", "email", "bank"]).optional(),
  status: z.enum(["confirmed", "pending", "duplicate"]).optional(),
  suggestedCategory: z.string().optional(),
  notes: z.string().optional(),
})

export type UpdateMovementDto = z.infer<typeof updateMovementSchema>
