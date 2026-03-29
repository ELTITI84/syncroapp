import { UsersRepository } from "@/repositories/users/users.repository"
import type { UpdateUserDto } from "@/types/users/dto/update-user.dto"

export class UsersService {
  constructor(private readonly usersRepository = new UsersRepository()) {}

  async getMe() {
    const profile = await this.usersRepository.getProfile()
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
    }
  }

  async updateMe(payload: UpdateUserDto) {
    const profile = await this.usersRepository.updateProfile(payload)
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
    }
  }
}
