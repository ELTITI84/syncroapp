export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type AuthSession = {
  user: UserProfile
  access_token: string
  expires_at: number
}
