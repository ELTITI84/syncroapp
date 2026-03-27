import { z } from "zod"

export const clientIdParamSchema = z.object({
  "client-id": z.string().min(1),
})

export type ClientIdParamDto = z.infer<typeof clientIdParamSchema>
