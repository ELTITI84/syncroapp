import { NotFoundException } from "@/exceptions/base/base-exceptions"

export class ClientNotFoundException extends NotFoundException {
  constructor(clientId: string) {
    super(`Client ${clientId} not found`, "El cliente solicitado no existe.")
  }
}
