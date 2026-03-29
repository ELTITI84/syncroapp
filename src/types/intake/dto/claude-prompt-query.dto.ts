import { z } from "zod"

import { importEntitySchema } from "@/types/intake/dto/import-preview.dto"

export const claudePromptQuerySchema = z.object({
  entityType: importEntitySchema,
})

export type ClaudePromptQueryDto = z.infer<typeof claudePromptQuerySchema>
