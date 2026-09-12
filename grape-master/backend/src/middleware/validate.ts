import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { sendError } from '../utils/apiResponse'

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed: any = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      if (parsed.body) req.body = parsed.body
      if (parsed.query) req.query = parsed.query as typeof req.query
      if (parsed.params) req.params = parsed.params as typeof req.params
      return next()
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = (err as any).issues?.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.').replace(/^body\./, '') : String(e.path),
          message: e.message,
        })) ?? []
        return sendError(res, 'Validation failed', 422, errors)
      }
      return next(err)
    }
  }
