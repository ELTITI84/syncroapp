import {
  OtpRequestException,
  OtpVerifyException,
  SessionNotFoundException,
} from "@/exceptions/auth/auth-exceptions"
import { AuthRepository } from "@/repositories/auth/auth.repository"
import type { RequestOtpDto } from "@/types/auth/dto/request-otp.dto"
import type { VerifyOtpDto } from "@/types/auth/dto/verify-otp.dto"

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  async requestOtp(payload: RequestOtpDto) {
    const { error } = await this.authRepository.requestOtp(payload)
    if (error) throw new OtpRequestException(error.message)
    return { sent: true, email: payload.email }
  }

  async verifyOtp(payload: VerifyOtpDto) {
    const { session, user, error } = await this.authRepository.verifyOtp(payload)
    if (error || !session || !user) throw new OtpVerifyException()

    const { profile } = await this.authRepository.getUserProfile(user.id)

    return {
      user: {
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        created_at: profile?.created_at ?? new Date().toISOString(),
      },
      expires_at: session.expires_at ?? 0,
    }
  }

  async getSession() {
    const { user, error } = await this.authRepository.getUser()
    if (error || !user) throw new SessionNotFoundException()

    const { profile } = await this.authRepository.getUserProfile(user.id)
    return {
      id: user.id,
      email: user.email!,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: profile?.created_at ?? new Date().toISOString(),
    }
  }

  async signOut() {
    await this.authRepository.signOut()
    return { success: true }
  }
}
