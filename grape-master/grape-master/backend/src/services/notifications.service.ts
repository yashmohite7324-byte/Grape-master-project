import { prisma } from '../config/prisma'
import { publishNotification } from '../config/redis'
import { logger } from '../utils/logger'

export interface NotifyPayload {
  userId: string
  title: string
  message: string
  type: 'ORDER' | 'PAYMENT' | 'OFFER' | 'SYSTEM' | 'ML'
  data?: Record<string, unknown>
}

/**
 * Creates a persistent notification in PostgreSQL AND pushes
 * a real-time event through Redis → WebSocket.
 */
export const notify = async (payload: NotifyPayload): Promise<void> => {
  try {
    // 1. Persist to DB (survives page reload / reconnect)
    await prisma.notification.create({
      data: {
        userId:  payload.userId,
        title:   payload.title,
        message: payload.message,
        type:    payload.type,
        data:    payload.data ?? {},
      },
    })

    // 2. Real-time push via Redis pub/sub → WebSocket relay
    await publishNotification(payload.userId, {
      type:    payload.type,
      title:   payload.title,
      message: payload.message,
      data:    payload.data,
    })
  } catch (e) {
    logger.warn('notify() failed', e)
  }
}

/** Notify multiple users at once */
export const notifyMany = async (payloads: NotifyPayload[]): Promise<void> => {
  await Promise.allSettled(payloads.map(notify))
}

// ── Pre-built notification templates ──

export const notifications = {
  offerReceived: (farmerId: string, brokerName: string, crop: string, qty: number, unit: string, total: number) =>
    notify({
      userId:  farmerId,
      title:   'New broker offer received',
      message: `${brokerName} offered ₹${total.toLocaleString('en-IN')} for ${qty} ${unit} of ${crop}`,
      type:    'OFFER',
      data:    { brokerName, crop, qty, unit, total },
    }),

  offerAccepted: (brokerId: string, crop: string, qty: number, unit: string, total: number) =>
    notify({
      userId:  brokerId,
      title:   'Offer accepted! 🎉',
      message: `Your offer for ${qty} ${unit} of ${crop} (₹${total.toLocaleString('en-IN')}) was accepted`,
      type:    'OFFER',
      data:    { crop, qty, unit, total },
    }),

  offerRejected: (brokerId: string, crop: string) =>
    notify({
      userId:  brokerId,
      title:   'Offer declined',
      message: `Your offer for ${crop} was declined by the farmer`,
      type:    'OFFER',
    }),

  orderPlaced: (sellerId: string, orderNumber: string, buyerName: string, items: number, total: number, fulfillment: string) =>
    notify({
      userId:  sellerId,
      title:   `New order ${orderNumber}`,
      message: `${buyerName} placed an order for ${items} item(s) — ₹${total.toLocaleString('en-IN')} — ${fulfillment}`,
      type:    'ORDER',
      data:    { orderNumber, buyerName, total, fulfillment },
    }),

  paymentSuccess: (buyerId: string, orderNumber: string, total: number, txnNumber: string) =>
    notify({
      userId:  buyerId,
      title:   'Payment successful ✓',
      message: `Order ${orderNumber} confirmed. ₹${total.toLocaleString('en-IN')} paid. Txn: ${txnNumber}`,
      type:    'PAYMENT',
      data:    { orderNumber, total, txnNumber },
    }),

  paymentFailed: (buyerId: string, orderNumber: string) =>
    notify({
      userId:  buyerId,
      title:   'Payment failed',
      message: `Payment for order ${orderNumber} could not be processed. Please try again.`,
      type:    'PAYMENT',
    }),

  orderStatusUpdate: (buyerId: string, orderNumber: string, status: string) =>
    notify({
      userId:  buyerId,
      title:   `Order ${orderNumber} update`,
      message: `Your order status changed to: ${status.replace(/_/g, ' ')}`,
      type:    'ORDER',
      data:    { orderNumber, status },
    }),

  receiptReady: (userId: string, orderNumber: string, receiptNumber: string) =>
    notify({
      userId,
      title:   'Receipt ready',
      message: `Receipt ${receiptNumber} for order ${orderNumber} is available for download`,
      type:    'PAYMENT',
      data:    { orderNumber, receiptNumber },
    }),
}
