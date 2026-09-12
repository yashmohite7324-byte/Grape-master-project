import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import * as controller from './seller.controller'
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  productIdSchema,
  sellerOrderQuerySchema,
} from './seller.validation'
import { paginationQuery } from '../../utils/pagination'

const router = Router()
router.use(authenticate, authorize('FERTILIZER_SELLER'))

// Products
router.post('/products', validate(createProductSchema), controller.createProduct)
router.get('/products', validate(z.object({ query: paginationQuery })), controller.getMyProducts)
router.get('/products/:id', validate(productIdSchema), controller.getMyProduct)
router.put('/products/:id', validate(updateProductSchema), controller.updateProduct)
router.patch('/products/:id/toggle', validate(productIdSchema), controller.toggleProduct)

// Inventory
router.patch('/inventory/:id', validate(adjustStockSchema), controller.adjustStock)

// Orders
router.get('/orders', validate(sellerOrderQuerySchema), controller.getMyOrders)
router.get('/orders/:id', validate(productIdSchema), controller.getMyOrder)
router.patch('/orders/:id/status',
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.string() }) })),
  controller.updateOrderStatus
)

export default router
