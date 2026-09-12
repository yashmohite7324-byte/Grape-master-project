import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import { sendError } from '../utils/apiResponse'

/**
 * Validates req.body/query/params against a Zod schema shaped like
 * z.object({ body, query, params }). On success, parsed values replace
 * the raw request values (coercion, defaults, stripping).
 */
export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      if (parsed.body) req.body = parsed.body
      if (parsed.params) req.params = parsed.params as typeof req.params
      return next()
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.').replace(/^body\./, ''),
          message: e.message,
        }))
        return sendError(res, 'Validation failed', 422, errors)
      }
      return next(err)
    }
  }
