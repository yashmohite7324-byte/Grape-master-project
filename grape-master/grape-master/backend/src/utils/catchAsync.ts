import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Wraps an async handler so rejected promises are forwarded to Express's
 * error middleware instead of crashing the process.
 */
export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
