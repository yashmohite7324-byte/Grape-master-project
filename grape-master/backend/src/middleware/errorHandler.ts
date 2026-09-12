import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { AppError } from '../utils/AppError'
import { sendError } from '../utils/apiResponse'
import { logger } from '../utils/logger'
import { isProd } from '../config/env'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Known operational errors
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode)
  }

  // Prisma unique-constraint and not-found errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ')
      return sendError(res, `A record with this ${target ?? 'value'} already exists`, 409)
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record not found', 404)
    }
  }

  // Unknown / programming errors
  const message = err instanceof Error ? err.message : 'Internal server error'
  logger.error('Unhandled error', err)
  return sendError(res, isProd ? 'Internal server error' : message, 500)
}

export const notFoundHandler = (req: Request, res: Response) =>
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404)
