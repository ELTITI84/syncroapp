export class BaseException extends Error {
  statusCode: number
  userMessage?: string

  constructor(message: string, statusCode = 500, userMessage?: string) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.userMessage = userMessage
  }
}

export class BadRequestException extends BaseException {
  constructor(message: string, userMessage?: string) {
    super(message, 400, userMessage)
  }
}

export class ValidationException extends BaseException {
  constructor(message: string, userMessage?: string) {
    super(message, 400, userMessage)
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message: string, userMessage?: string) {
    super(message, 401, userMessage)
  }
}

export class ForbiddenException extends BaseException {
  constructor(message: string, userMessage?: string) {
    super(message, 403, userMessage)
  }
}

export class NotFoundException extends BaseException {
  constructor(message: string, userMessage?: string) {
    super(message, 404, userMessage)
  }
}

export class ConflictException extends BaseException {
  constructor(message: string, userMessage?: string) {
    super(message, 409, userMessage)
  }
}

export class DatabaseException extends BaseException {
  constructor(message: string, userMessage?: string) {
    super(message, 500, userMessage)
  }
}
