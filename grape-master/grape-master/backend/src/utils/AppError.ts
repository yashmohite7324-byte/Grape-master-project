/**
 * Operational error with an HTTP status code. Thrown anywhere in the app
 * and handled centrally by the errorHandler middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(msg = 'Bad request') {
    return new AppError(400, msg)
  }
  static unauthorized(msg = 'Unauthorized') {
    return new AppError(401, msg)
  }
  static forbidden(msg = 'Forbidden') {
    return new AppError(403, msg)
  }
  static notFound(msg = 'Not found') {
    return new AppError(404, msg)
  }
  static conflict(msg = 'Conflict') {
    return new AppError(409, msg)
  }
}
