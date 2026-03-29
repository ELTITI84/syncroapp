import { BaseException } from "@/exceptions/base/base-exceptions"

export class UserNotFoundException extends BaseException {
  constructor() {
    super("User not found", 404, "Usuario no encontrado.")
  }
}

export class UserUpdateException extends BaseException {
  constructor(message: string) {
    super(message, 500, "No se pudo actualizar el perfil. Intentá de nuevo.")
  }
}
