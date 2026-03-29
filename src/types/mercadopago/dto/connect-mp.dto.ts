import { z } from "zod"

export const mpMovementsQuerySchema = z.object({
  period: z
    .enum(["current_month", "last_month", "3_months", "6_months", "last_12_months"])
    .optional()
    .default("current_month"),
  status: z.enum(["all", "approved", "pending", "rejected"]).optional().default("all"),
})

export type MpMovementsQueryDto = z.infer<typeof mpMovementsQuerySchema>

export const mpSyncSchema = z.object({
  period: z
    .enum(["current_month", "last_month", "3_months", "6_months", "last_12_months"])
    .optional()
    .default("current_month"),
})

export type MpSyncDto = z.infer<typeof mpSyncSchema>
