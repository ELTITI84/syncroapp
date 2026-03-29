import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { RequestOtpDto } from "@/types/auth/dto/request-otp.dto"
import type { VerifyOtpDto } from "@/types/auth/dto/verify-otp.dto"

export class AuthRepository {
  async requestOtp(payload: RequestOtpDto) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: payload.email,
      options: {
        shouldCreateUser: true,
      },
    })
    return { error }
  }

  async verifyOtp(payload: VerifyOtpDto) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email: payload.email,
      token: payload.token,
      type: "email",
    })
    return { session: data.session, user: data.user, error }
  }

  async getUser() {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    return { user: data.user, error }
  }

  async signOut() {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  async getUserProfile(userId: string) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()
    return { profile: data, error }
  }
}
