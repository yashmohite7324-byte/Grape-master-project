import { z } from 'zod'
import { paginationQuery } from '../../utils/pagination'

const UNITS = ['KG', 'QUINTAL', 'TON', 'BAG', 'CRATE', 'DOZEN'] as const

export const createListingSchema = z.object({
  body: z.object({
    cropType: z.string().min(2),
    variety: z.string().optional(),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unit: z.enum(UNITS),
    expectedPrice: z.number().positive('Price must be greater than 0'),
    harvestDate: z.coerce.date(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    description: z.string().max(2000).optional(),
    images: z.array(z.string().url()).max(6).optional(),
  }),
})

export const updateListingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    variety: z.string().optional(),
    expectedPrice: z.number().positive().optional(),
    description: z.string().max(2000).optional(),
    images: z.array(z.string().url()).max(6).optional(),
    // quantity is only editable while nothing has been sold yet (enforced in service)
    quantity: z.number().positive().optional(),
    harvestDate: z.coerce.date().optional(),
  }),
})

export const listingIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const myListingsQuerySchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(['ACTIVE', 'SOLD', 'EXPIRED', 'CANCELLED']).optional(),
  }),
})

export const offerActionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export type CreateListingInput = z.infer<typeof createListingSchema>['body']
export type UpdateListingInput = z.infer<typeof updateListingSchema>['body']
