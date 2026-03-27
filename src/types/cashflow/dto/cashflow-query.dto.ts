import { z } from "zod"

const booleanish = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((value) => value === true || value === "true")

export const cashflowQuerySchema = z.object({
  collectOverdue: booleanish,
  delaySupplier: booleanish,
  trimSaas: booleanish,
})

export type CashflowQueryDto = z.infer<typeof cashflowQuerySchema>
