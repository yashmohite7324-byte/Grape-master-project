import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import { paginationQuery } from '../../utils/pagination'
import * as adminService from './admin.service'

const router = Router()
router.use(authenticate, authorize('ADMIN'))

const queryWithSearch = z.object({
  query: paginationQuery.extend({
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
  }),
})
// Dashboard stats
router.get(
  '/stats',
  catchAsync(async (_req, res) => {
    const stats = await adminService.getPlatformStats()
    sendSuccess(res, stats, 'Platform stats')
  })
)

// Users
router.get(
  '/users',
  validate(queryWithSearch),
  catchAsync(async (req, res) => {
    const { page, limit, role, search } = req.query as unknown as {
      page: number; limit: number; role?: string; search?: string
    }
    const { items, meta } = await adminService.getAllUsers({ page, limit }, role, search)
    sendSuccess(res, items, 'All users', 200, meta)
  })
)

router.patch(
  '/users/:id',
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ isActive: z.boolean().optional() }) })),
  catchAsync(async (req, res) => {
    const user = await adminService.updateUser(req.params.id, req.body)
    sendSuccess(res, user, 'User updated')
  })
)

// Orders
router.get(
  '/orders',
  validate(queryWithSearch),
  catchAsync(async (req, res) => {
    const { page, limit, status } = req.query as unknown as { page: number; limit: number; status?: string }
    const { items, meta } = await adminService.getAllOrders({ page, limit }, status)
    sendSuccess(res, items, 'All orders', 200, meta)
  })
)

// Products
router.get(
  '/products',
  validate(queryWithSearch),
  catchAsync(async (req, res) => {
    const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string }
    const { items, meta } = await adminService.getAllProducts({ page, limit }, search)
    sendSuccess(res, items, 'All products', 200, meta)
  })
)

router.patch(
  '/products/:id',
  validate(z.object({
    params: z.object({ id: z.string() }),
    body: z.object({ isActive: z.boolean().optional(), price: z.number().positive().optional() }),
  })),
  catchAsync(async (req, res) => {
    const product = await adminService.adminUpdateProduct(req.params.id, req.body)
    sendSuccess(res, product, 'Product updated')
  })
)

// Transactions
router.get(
  '/transactions',
  validate(z.object({ query: paginationQuery })),
  catchAsync(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }
    const { items, meta } = await adminService.getAllTransactions({ page, limit })
    sendSuccess(res, items, 'All transactions', 200, meta)
  })
)

// Inventory overview
router.get(
  '/inventory',
  catchAsync(async (_req, res) => {
    const data = await adminService.getInventoryOverview()
    sendSuccess(res, data, 'Inventory overview')
  })
)

export default router
