import { z } from "zod"

export const transactionIdParamSchema = z.object({
  "movement-id": z.string().min(1),
})

export type TransactionIdParamDto = z.infer<typeof transactionIdParamSchema>
