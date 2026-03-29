import { z } from "zod"

export const requestOtpSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
})

export type RequestOtpDto = z.infer<typeof requestOtpSchema>
