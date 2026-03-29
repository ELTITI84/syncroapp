import { NotFoundException } from "@/exceptions/base/base-exceptions"

export class TransactionNotFoundException extends NotFoundException {
  constructor(transactionId: string) {
    super(`Transaction ${transactionId} not found`, "La transacción solicitada no existe.")
  }
}
