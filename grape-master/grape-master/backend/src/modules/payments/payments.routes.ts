import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import * as paymentsService from './payments.service'

const router = Router()

// Initiate payment for an order
router.post(
  '/initiate',
  authenticate,
  validate(z.object({ body: z.object({ orderId: z.string().min(1) }) })),
  catchAsync(async (req, res) => {
    const result = await paymentsService.initiatePayment(req.body.orderId, req.user!.id)
    sendSuccess(res, result, 'Payment initiated')
  })
)

// Demo-only: simulate successful payment (use when PhonePe sandbox not configured)
router.post(
  '/simulate-success',
  authenticate,
  validate(z.object({ body: z.object({ orderId: z.string().min(1) }) })),
  catchAsync(async (req, res) => {
    const result = await paymentsService.simulatePaymentSuccess(req.body.orderId)
    sendSuccess(res, result, 'Payment simulated as successful')
  })
)

// PhonePe server-to-server callback (no auth — called by PhonePe servers)
router.post(
  '/callback',
  catchAsync(async (req, res) => {
    const result = await paymentsService.handleCallback(req.body)
    res.status(200).json({ success: true, data: result })
  })
)

// Get payment status for an order
router.get(
  '/:orderId',
  authenticate,
  catchAsync(async (req, res) => {
    const result = await paymentsService.getPaymentStatus(req.params.orderId, req.user!.id)
    sendSuccess(res, result, 'Payment status')
  })
)

export default router
