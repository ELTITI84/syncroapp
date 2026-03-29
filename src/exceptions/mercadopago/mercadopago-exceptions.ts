import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@/exceptions/base/base-exceptions"

export class MpInvalidTokenException extends UnauthorizedException {
  constructor() {
    super(
      "MP access token inválido o expirado",
      "No pudimos completar la vinculación con Mercado Pago. Intentá de nuevo.",
    )
  }
}

export class MpNotConnectedException extends NotFoundException {
  constructor() {
    super(
      "No hay cuenta de Mercado Pago conectada",
      "Primero necesitás vincular tu cuenta de Mercado Pago.",
    )
  }
}

export class MpSyncException extends BadRequestException {
  constructor(detail: string) {
    super(
      `Error al sincronizar con MP: ${detail}`,
      "No pudimos obtener los movimientos de Mercado Pago. Intentá nuevamente en unos segundos.",
    )
  }
}

export class MpOauthStateException extends UnauthorizedException {
  constructor() {
    super(
      "State inválido en OAuth de Mercado Pago",
      "La vinculación con Mercado Pago expiró o no es válida. Volvé a intentarlo.",
    )
  }
}

export class MpConfigurationException extends BadRequestException {
  constructor() {
    super(
      "Faltan variables de entorno de Mercado Pago",
      "La integración con Mercado Pago no está configurada todavía.",
    )
  }
}
