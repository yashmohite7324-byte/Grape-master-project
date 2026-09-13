import { Router } from 'express'
import { z } from 'zod'
import * as controller from './broker.controller'
import { authenticate, authorize } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import {
  marketplaceQuerySchema,
  listingIdSchema,
  makeOfferSchema,
  myOffersQuerySchema,
  updateSellingPriceSchema,
} from './broker.validation'
import { paginationQuery } from '../../utils/pagination'

const router = Router()

// Marketplace (farmer produce) & Public Bids — accessible by any logged in user
router.get('/marketplace', authenticate, validate(marketplaceQuerySchema), controller.browseMarketplace)
router.get('/marketplace/:id', authenticate, validate(listingIdSchema), controller.getMarketplaceListing)
router.get('/public-offers', authenticate, controller.getPublicOffers)

// Require BROKER role for bidding and inventory management
router.use(authenticate, authorize('BROKER'))

// Offers
router.post('/marketplace/:id/offer', validate(makeOfferSchema), controller.makeOffer)
router.get('/offers', validate(myOffersQuerySchema), controller.getMyOffers)
router.patch('/offers/:id/withdraw', validate(listingIdSchema), controller.withdrawOffer)

// Inventory
router.get(
  '/inventory',
  validate(z.object({ query: paginationQuery })),
  controller.getInventory
)
router.patch(
  '/inventory/:id/price',
  validate(updateSellingPriceSchema),
  controller.updateSellingPrice
)

export default router
