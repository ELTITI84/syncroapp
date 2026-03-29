import { z } from "zod"

export const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  token: z
    .string()
    .length(8, "El código debe tener 8 dígitos")
    .regex(/^\d+$/, "Solo números"),
})

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>
