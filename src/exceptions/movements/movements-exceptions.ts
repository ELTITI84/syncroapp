import { NotFoundException } from "@/exceptions/base/base-exceptions"

export class MovementNotFoundException extends NotFoundException {
  constructor(movementId: string) {
    super(`Movement ${movementId} not found`, "El movimiento solicitado no existe.")
  }
}
