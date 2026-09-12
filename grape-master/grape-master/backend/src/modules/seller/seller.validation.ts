import { z } from 'zod'
import { paginationQuery } from '../../utils/pagination'

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().max(2000).optional(),
    category: z.string().min(1),
    brand: z.string().optional(),
    unit: z.string().min(1),
    price: z.number().positive(),
    initialStock: z.number().min(0).default(0),
    images: z.array(z.string().url()).max(6).optional(),
  }),
})

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    unit: z.string().optional(),
    price: z.number().positive().optional(),
    isActive: z.boolean().optional(),
    images: z.array(z.string().url()).max(6).optional(),
  }),
})

export const adjustStockSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    adjustment: z.number().int().refine((n) => n !== 0, 'Adjustment cannot be zero'),
  }),
})

export const productIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const sellerOrderQuerySchema = z.object({
  query: paginationQuery.extend({
    status: z.string().optional(),
  }),
})

export type CreateProductInput = z.infer<typeof createProductSchema>['body']
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body']
