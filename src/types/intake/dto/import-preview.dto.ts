import { z } from "zod"

export const importEntitySchema = z.enum(["transactions", "invoices"])

export const importPreviewSchema = z.object({
  entityType: importEntitySchema,
  filename: z.string().min(1),
  csvContent: z.string().min(1),
})

export type ImportEntity = z.infer<typeof importEntitySchema>
export type ImportPreviewDto = z.infer<typeof importPreviewSchema>
