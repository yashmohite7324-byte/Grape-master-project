import { z } from 'zod'
import { paginationQuery } from '../../utils/pagination'

export const marketplaceQuerySchema = z.object({
  query: paginationQuery.extend({
    cropType: z.string().optional(),
    variety: z.string().optional(),
    minQuantity: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    sort: z.enum(['newest', 'priceAsc', 'priceDesc', 'quantityDesc']).default('newest'),
  }),
})

export const listingIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const makeOfferSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // listing id
  body: z.object({
    quantity: z.number().positive('Quantity must be greater than 0'),
    offerPrice: z.number().positive('Offer price must be greater than 0'),
    message: z.string().max(500).optional(),
  }),
})

export const myOffersQuerySchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  }),
})

export const updateSellingPriceSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // inventory id
  body: z.object({
    sellingPrice: z.number().positive('Selling price must be greater than 0'),
  }),
})

export type MakeOfferInput = z.infer<typeof makeOfferSchema>['body']
