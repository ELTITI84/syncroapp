import { z } from "zod"

export const clientsQuerySchema = z.object({
  highlight: z.string().optional(),
})

export type ClientsQueryDto = z.infer<typeof clientsQuerySchema>
