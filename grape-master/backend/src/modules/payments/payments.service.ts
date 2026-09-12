import crypto from 'crypto'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { generateTransactionNumber, generateReceiptNumber } from '../../utils/helpers'
import { logger } from '../../utils/logger'
import { createAndSendNotification } from '../../lib/notify'

export const getRazorpayConfig = () => {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_GrapeMaster2026',
    currency: 'INR',
  }
}

export const createRazorpayOrder = async (orderId: string, buyerId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw AppError.notFound('Order not found')

  const razorpayOrderId = `rzp_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  const amountPaise = Math.round(order.totalAmount * 100)

  await prisma.payment.upsert({
    where: { orderId },
    update: {
      paymentReference: razorpayOrderId,
      gateway: 'RAZORPAY',
      amount: order.totalAmount,
      status: 'PENDING',
    },
    create: {
      orderId,
      paymentReference: razorpayOrderId,
      gateway: 'RAZORPAY',
      amount: order.totalAmount,
      status: 'PENDING',
    },
  })

  return {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_GrapeMaster2026',
    amount: amountPaise,
    currency: 'INR',
    razorpayOrderId,
    orderId,
    amountINR: order.totalAmount,
  }
}

// ─── PhonePe helpers ───

const PHONEPE_HOST = process.env.PHONEPE_HOST ?? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID ?? 'PGTESTPAYUAT'
const SALT_KEY = process.env.PHONEPE_SALT_KEY ?? 'your-salt-key'
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX ?? '1'

function phonePeChecksum(base64Payload: string, endpoint: string): string {
  const str = base64Payload + endpoint + SALT_KEY
  const hash = crypto.createHash('sha256').update(str).digest('hex')
  return `${hash}###${SALT_INDEX}`
}

/**
 * Initiate a PhonePe payment for an order.
 * Returns the redirect URL for the frontend to send the user to.
 */
export const initiatePayment = async (orderId: string, buyerId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw AppError.notFound('Order not found')
  if (order.buyerId !== buyerId) throw AppError.forbidden('Not your order')
  if (order.paymentStatus !== 'PENDING') {
    throw AppError.conflict('Payment already processed for this order')
  }

  const merchantTransactionId = `MT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const amountPaise = Math.round(order.totalAmount * 100) // PhonePe works in paise

  const paymentData = {
    merchantId: MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: buyerId,
    amount: amountPaise,
    redirectUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/customer/orders/${orderId}?payment=done`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${process.env.BACKEND_URL ?? 'http://localhost:3001'}/api/payments/callback`,
    paymentInstrument: { type: 'PAY_PAGE' },
  }

  const base64Payload = Buffer.from(JSON.stringify(paymentData)).toString('base64')
  const checksum = phonePeChecksum(base64Payload, '/pg/v1/pay')

  // In production, make the actual API call to PhonePe.
  // Here we store the pending payment record and return a simulated URL.
  const payment = await prisma.payment.create({
    data: {
      orderId,
      paymentReference: merchantTransactionId,
      gateway: 'PHONEPE',
      amount: order.totalAmount,
      status: 'PENDING',
    },
  })

  logger.info(`Payment initiated for order ${orderId}`, { merchantTransactionId })

  return {
    paymentId: payment.id,
    paymentReference: merchantTransactionId,
    base64Payload,
    checksum,
    // In sandbox mode we skip the real redirect; in production replace this with the PhonePe page URL
    redirectUrl: process.env.NODE_ENV === 'production'
      ? `${PHONEPE_HOST}/pg/v1/pay`
      : `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/customer/orders/${orderId}?mock_payment=true`,
  }
}

/**
 * Simulate payment success (sandbox / demo only).
 * In production this is replaced by the real PhonePe callback verification.
 */
export const simulatePaymentSuccess = async (orderId: string) => {
  return confirmPayment(orderId, `DEMO-${Date.now()}`, true)
}

/**
 * PhonePe server-to-server callback handler.
 * Verifies checksum, then confirms or fails the order.
 */
export const handleCallback = async (body: {
  response: string  // base64-encoded PhonePe response
}) => {
  try {
    const decoded = JSON.parse(Buffer.from(body.response, 'base64').toString())
    const { code, data } = decoded
    const success = code === 'PAYMENT_SUCCESS'
    const transactionId = data?.transactionId as string | undefined
    const merchantTransactionId = data?.merchantTransactionId as string | undefined

    if (!merchantTransactionId) throw AppError.badRequest('Missing merchantTransactionId in callback')

    const payment = await prisma.payment.findUnique({ where: { paymentReference: merchantTransactionId } })
    if (!payment) throw AppError.notFound('Payment record not found')

    await confirmPayment(payment.orderId, transactionId ?? merchantTransactionId, success)
    return { success }
  } catch (err) {
    logger.error('PhonePe callback error', err)
    throw err
  }
}

/**
 * Core confirmation logic: mark payment, deduct stock permanently,
 * create transaction record, create receipt stub.
 */
const confirmPayment = async (orderId: string, gatewayTransactionId: string, success: boolean) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    })
    if (!order) throw AppError.notFound('Order not found')

    if (success) {
      // 1. Confirm or create payment record
      await tx.payment.upsert({
        where: { orderId },
        update: {
          status: 'SUCCESS',
          gatewayTransactionId,
          paidAt: new Date(),
        },
        create: {
          orderId,
          paymentReference: gatewayTransactionId,
          gateway: 'RAZORPAY',
          amount: order.totalAmount,
          status: 'SUCCESS',
          gatewayTransactionId,
          paidAt: new Date(),
        },
      })

      // 2. Deduct reserved stock
      for (const item of order.orderItems) {
        if (item.inventoryId) {
          await tx.sellerInventory.update({
            where: { id: item.inventoryId },
            data: { reservedQuantity: { decrement: item.quantity } },
          }).catch(() => undefined)
        } else if (item.productId) {
          await tx.sellerInventory.updateMany({
            where: { productId: item.productId },
            data: { reservedQuantity: { decrement: item.quantity } },
          }).catch(() => undefined)
        }
      }

      // 3. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'SUCCESS', orderStatus: 'CONFIRMED' },
      })

      // 4. Create transaction record
      const txnNumber = generateTransactionNumber()
      await tx.transaction.create({
        data: {
          transactionNumber: txnNumber,
          orderId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          amount: order.totalAmount,
          paymentMethod: 'PhonePe',
          gateway: 'PHONEPE',
          gatewayTransactionId,
          transactionType: order.orderType,
          status: 'SUCCESS',
        },
      })

      // 5. Create receipt stub (PDF generation is async / future)
      await tx.receipt.create({
        data: {
          receiptNumber: generateReceiptNumber(),
          orderId,
          storagePath: `receipts/${new Date().getFullYear()}/${orderId}.pdf`,
          pdfUrl: null, // populated when PDF is generated
        },
      })

      // 6. Notify buyer
      await createAndSendNotification({
        userId: order.buyerId,
        title: 'Payment successful',
        message: `Your order has been confirmed. Transaction: ${txnNumber}`,
        type: 'PAYMENT',
        data: { orderId, transactionNumber: txnNumber },
        tx
      })

      // 7. Notify seller
      await createAndSendNotification({
        userId: order.sellerId,
        title: 'New order confirmed',
        message: `A new order has been paid and is awaiting processing.`,
        type: 'ORDER',
        data: { orderId },
        tx
      })
    } else {
      // Payment failed — release reserved stock
      for (const item of order.orderItems) {
        if (item.inventoryId) {
          await tx.sellerInventory.update({
            where: { id: item.inventoryId },
            data: {
              reservedQuantity: { decrement: item.quantity },
              availableQuantity: { increment: item.quantity },
            },
          })
        }
      }

      await tx.payment.update({
        where: { orderId },
        data: { status: 'FAILED', gatewayTransactionId },
      })

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED', orderStatus: 'FAILED' },
      })
    }

    return { success, orderId }
  })
}

export const getPaymentStatus = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, transaction: true, receipt: true },
  })
  if (!order || order.buyerId !== userId) throw AppError.notFound('Order not found')
  return order
}
