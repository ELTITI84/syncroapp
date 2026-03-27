import { z } from "zod"

export const movementIdParamSchema = z.object({
  "movement-id": z.string().min(1),
})

export type MovementIdParamDto = z.infer<typeof movementIdParamSchema>
