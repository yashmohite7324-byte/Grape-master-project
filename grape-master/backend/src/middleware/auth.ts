import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import { env } from '../config/env'
import { AppError } from '../utils/AppError'

export interface TokenPayload {
  id: string
  email: string
  role: UserRole
}

// Augment Express Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as TokenPayload

/** Requires a valid Bearer token; attaches req.user. */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('No token provided')
  }
  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch {
    throw AppError.unauthorized('Invalid or expired token')
  }
}

/** Restricts a route to one or more roles (use after authenticate). */
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized('Authentication required')
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('You do not have permission to perform this action')
    }
    next()
  }

/** Attach user to req if token present but do not block unauthenticated requests. */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const decoded = verifyToken(header.slice(7))
      req.user = decoded
    }
  } catch { /* ignore */ }
  next()
}
