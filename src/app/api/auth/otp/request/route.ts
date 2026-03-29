import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { AuthService } from "@/services/auth/auth.service"
import { requestOtpSchema } from "@/types/auth/dto/request-otp.dto"

const authService = new AuthService()

export async function POST(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsed = requestOtpSchema.safeParse(body)
    if (!parsed.success) throw new ValidationException(parsed.error.message, "Email inválido.")
    return authService.requestOtp(parsed.data)
  })
}
