import { routeHandler } from "@/lib/handlers/route-handler"
import { AuthService } from "@/services/auth/auth.service"

const authService = new AuthService()

export async function GET() {
  return routeHandler(async () => authService.getSession())
}
