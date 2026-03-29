import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import { UserNotFoundException, UserUpdateException } from "@/exceptions/users/users-exceptions"
import type { UpdateUserDto } from "@/types/users/dto/update-user.dto"

export class UsersRepository extends AuthenticatedRepository {
  async getProfile() {
    const [supabase, userId] = await this.getClientAndUserId()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()
    if (error || !data) throw new UserNotFoundException()
    return data
  }

  async updateProfile(payload: UpdateUserDto) {
    const [supabase, userId] = await this.getClientAndUserId()
    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select("*")
      .single()
    if (error || !data) throw new UserUpdateException(error?.message ?? "Update failed")
    return data
  }
}
