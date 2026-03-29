import { z } from "zod"

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
})

export type UpdateUserDto = z.infer<typeof updateUserSchema>
