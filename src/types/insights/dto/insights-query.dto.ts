import { z } from "zod"

export const insightsQuerySchema = z.object({})

export type InsightsQueryDto = z.infer<typeof insightsQuerySchema>
