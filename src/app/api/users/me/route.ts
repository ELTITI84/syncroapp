import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { UsersService } from "@/services/users/users.service"
import { updateUserSchema } from "@/types/users/dto/update-user.dto"

const usersService = new UsersService()

export async function GET() {
  return routeHandler(async () => usersService.getMe())
}

export async function PATCH(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) throw new ValidationException(parsed.error.message, "Datos de perfil inválidos.")
    return usersService.updateMe(parsed.data)
  })
}
