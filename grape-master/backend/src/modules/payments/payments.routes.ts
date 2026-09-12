import { Router } from 'express'
import { z } from 'zod'
import { authenticate, optionalAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import * as paymentsService from './payments.service'

const router = Router()

// Public Razorpay API key endpoint
router.get(
  '/razorpay-key',
  catchAsync(async (_req, res) => {
    const config = paymentsService.getRazorpayConfig()
    sendSuccess(res, config, 'Razorpay config')
  })
)

// Initiate payment for an order
router.post(
  '/initiate',
  optionalAuth,
  validate(z.object({ body: z.object({ orderId: z.string().min(1) }) })),
  catchAsync(async (req, res) => {
    const userId = req.user?.id || 'guest'
    const result = await paymentsService.initiatePayment(req.body.orderId, userId)
    sendSuccess(res, result, 'Payment initiated')
  })
)

// Create Razorpay payment order
router.post(
  '/razorpay-order',
  optionalAuth,
  validate(z.object({ body: z.object({ orderId: z.string().min(1) }) })),
  catchAsync(async (req, res) => {
    const userId = req.user?.id || 'guest'
    const result = await paymentsService.createRazorpayOrder(req.body.orderId, userId)
    sendSuccess(res, result, 'Razorpay order created')
  })
)

// Demo & live simulator payment confirmation
router.post(
  '/simulate-success',
  optionalAuth,
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
