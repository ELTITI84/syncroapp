import { z } from "zod"

export const dashboardQuerySchema = z.object({})

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>
