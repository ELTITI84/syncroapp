import { z } from "zod"

export const importConfirmSchema = z.object({
  intakeLogId: z.string().uuid(),
})

export type ImportConfirmDto = z.infer<typeof importConfirmSchema>
