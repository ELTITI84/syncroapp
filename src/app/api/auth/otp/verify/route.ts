import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { AuthService } from "@/services/auth/auth.service"
import { verifyOtpSchema } from "@/types/auth/dto/verify-otp.dto"

const authService = new AuthService()

export async function POST(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsed = verifyOtpSchema.safeParse(body)
    if (!parsed.success) throw new ValidationException(parsed.error.message, "Código inválido.")
    return authService.verifyOtp(parsed.data)
  })
}
