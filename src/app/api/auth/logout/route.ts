import { routeHandler } from "@/lib/handlers/route-handler"
import { AuthService } from "@/services/auth/auth.service"

const authService = new AuthService()

export async function POST() {
  return routeHandler(async () => authService.signOut())
}
