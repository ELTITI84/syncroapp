import { BaseException, UnauthorizedException } from "@/exceptions/base/base-exceptions"

export class OtpRequestException extends BaseException {
  constructor(message: string) {
    super(message, 400, "No pudimos enviar el código. Verificá el email ingresado.")
  }
}

export class OtpVerifyException extends BaseException {
  constructor() {
    super("OTP verification failed", 401, "Código inválido o expirado. Solicitá uno nuevo.")
  }
}

export class SessionNotFoundException extends UnauthorizedException {
  constructor() {
    super("No active session", "Tu sesión expiró. Ingresá nuevamente.")
  }
}
