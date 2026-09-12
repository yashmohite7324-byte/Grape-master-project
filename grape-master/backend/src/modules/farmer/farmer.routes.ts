import { Router } from 'express'
import * as controller from './farmer.controller'
import { authenticate, authorize } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import {
  createListingSchema,
  updateListingSchema,
  listingIdSchema,
  myListingsQuerySchema,
  offerActionSchema,
} from './farmer.validation'
import { paginationQuery } from '../../utils/pagination'
import { z } from 'zod'

const router = Router()

// Every farmer route requires an authenticated FARMER.
router.use(authenticate, authorize('FARMER'))

// Listings
router.post('/listings', validate(createListingSchema), controller.createListing)
router.get('/listings', validate(myListingsQuerySchema), controller.getMyListings)
router.get('/listings/:id', validate(listingIdSchema), controller.getMyListing)
router.put('/listings/:id', validate(updateListingSchema), controller.updateListing)
router.patch('/listings/:id/cancel', validate(listingIdSchema), controller.cancelListing)

// Offers received on the farmer's listings
router.get(
  '/offers',
  validate(z.object({ query: paginationQuery })),
  controller.getReceivedOffers
)
router.post('/offers/:id/accept', validate(offerActionSchema), controller.acceptOffer)
router.post('/offers/:id/reject', validate(offerActionSchema), controller.rejectOffer)

export default router
