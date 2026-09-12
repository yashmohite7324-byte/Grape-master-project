import { z } from 'zod'
import { paginationQuery } from '../../utils/pagination'

export const createOrderSchema = z.object({
  body: z.object({
    sellerId: z.string().min(1),
    orderType: z.enum(['FERTILIZER', 'BROKER_PRODUCE']).default('FERTILIZER'),
    fulfillmentMethod: z.enum(['PICKUP', 'DELIVERY']),
    items: z.array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
      })
    ).min(1),
    // For delivery: embed the address (creates it on the fly)
    shippingAddress: z.object({
      fullName: z.string().min(2),
      mobileNumber: z.string().min(10),
      addressLine: z.string().min(3),
      village: z.string().min(1),
      district: z.string().min(1),
      state: z.string().min(1),
      pincode: z.string().min(6).max(6),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
    discount: z.number().min(0).default(0),
  }),
})

export const orderQuerySchema = z.object({
  query: paginationQuery.extend({
    status: z.string().optional(),
    type: z.enum(['FERTILIZER', 'BROKER_PRODUCE']).optional(),
  }),
})

export const orderIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body']
