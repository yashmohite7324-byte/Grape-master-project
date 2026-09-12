import { Response } from 'express'

interface Meta {
  page?: number
  limit?: number
  total?: number
}

/** Consistent success envelope used by every endpoint. */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Meta
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  })
}

/** Consistent error envelope (used mainly by the error handler). */
export const sendError = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  errors?: unknown
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  })
}
