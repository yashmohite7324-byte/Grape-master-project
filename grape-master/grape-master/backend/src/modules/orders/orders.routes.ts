import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import { createOrderSchema, orderQuerySchema, orderIdSchema } from './orders.validation'
import * as ordersService from './orders.service'
import { paginationQuery } from '../../utils/pagination'

const router = Router()
router.use(authenticate)

// Customer places an order
router.post(
  '/',
  authorize('CUSTOMER'),
  validate(createOrderSchema),
  catchAsync(async (req: Request, res: Response) => {
    const order = await ordersService.createOrder(req.user!.id, req.body)
    sendSuccess(res, order, 'Order created', 201)
  })
)

// Buyer order list + detail
router.get(
  '/',
  validate(orderQuerySchema),
  catchAsync(async (req: Request, res: Response) => {
    const { page, limit, status } = req.query as unknown as { page: number; limit: number; status?: string }
    const { items, meta } = await ordersService.getBuyerOrders(req.user!.id, { page, limit }, status)
    sendSuccess(res, items, 'Your orders', 200, meta)
  })
)

router.get(
  '/:id',
  validate(orderIdSchema),
  catchAsync(async (req: Request, res: Response) => {
    const order = await ordersService.getBuyerOrder(req.user!.id, req.params.id)
    sendSuccess(res, order, 'Order detail')
  })
)

router.patch(
  '/:id/cancel',
  validate(orderIdSchema),
  authorize('CUSTOMER'),
  catchAsync(async (req: Request, res: Response) => {
    const order = await ordersService.cancelOrder(req.user!.id, req.params.id)
    sendSuccess(res, order, 'Order cancelled')
  })
)

// Status update route reused by seller module too
router.patch(
  '/:id/status',
  validate(z.object({
    params: z.object({ id: z.string() }),
    body: z.object({ status: z.string().min(1) }),
  })),
  catchAsync(async (req: Request, res: Response) => {
    // The seller service owns the status state machine; import inline to avoid circular dep
    const { updateOrderStatus } = await import('../seller/seller.service')
    const order = await updateOrderStatus(req.user!.id, req.params.id, req.body.status)
    sendSuccess(res, order, 'Status updated')
  })
)

// Receipt for a specific order
router.get(
  '/:id/receipt',
  validate(orderIdSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { prisma } = await import('../../config/prisma')
    const receipt = await prisma.receipt.findFirst({
      where: { orderId: req.params.id },
      include: { order: true },
    })
    if (!receipt) throw (await import('../../utils/AppError')).AppError.notFound('Receipt not found')
    sendSuccess(res, receipt, 'Receipt')
  })
)

export default router
