import { z } from "zod"

export const createMovementSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  source: z.enum(["manual", "email", "bank"]).default("manual"),
  notes: z.string().optional(),
})

export type CreateMovementDto = z.infer<typeof createMovementSchema>
