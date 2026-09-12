import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { toSkipTake, pageMeta, type PageParams } from '../../utils/pagination'
import { generateOrderNumber, calcDeliveryCharge } from '../../utils/helpers'
import type { CreateOrderInput } from './orders.validation'

const DELIVERY_DISTANCE_KM = 10 // default until GPS-based calc in Phase 4

const orderInclude = {
  buyer: { include: { profile: true } },
  seller: { include: { profile: true, sellerProfile: true } },
  orderItems: {
    include: {
      product: true,
      sellerInventory: true,
      brokerInventory: true,
    },
  },
  receipt: true,
  payment: true,
  transaction: true,
}

/**
 * Create a new order (customer → seller or customer → broker).
 * Validates and reserves stock atomically.
 */
export const createOrder = async (buyerId: string, input: CreateOrderInput) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validate stock for every item
    const enrichedItems = await Promise.all(
      input.items.map(async (item) => {
        const inv = await tx.sellerInventory.findFirst({
          where: { productId: item.productId, sellerId: input.sellerId },
        })
        if (!inv) throw AppError.badRequest(`No inventory for product ${item.productId}`)
        if (inv.availableQuantity < item.quantity) {
          throw AppError.badRequest(
            `Insufficient stock: only ${inv.availableQuantity} available for product ${item.productId}`
          )
        }
        return { ...item, inventoryId: inv.id }
      })
    )

    // 2. Calculate totals
    const subtotal = enrichedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const deliveryCharge =
      input.fulfillmentMethod === 'DELIVERY' ? calcDeliveryCharge(DELIVERY_DISTANCE_KM) : 0
    const tax = 0
    const discount = input.discount ?? 0
    const totalAmount = subtotal + deliveryCharge + tax - discount

    // 3. Create or find shipping address
    const addr = await tx.address.create({
      data: {
        userId: buyerId,
        ...input.shippingAddress,
        isDefault: false,
      },
    })

    // 4. Create order
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        buyerId,
        sellerId: input.sellerId,
        orderType: input.orderType,
        subtotal,
        deliveryCharge,
        tax,
        discount,
        totalAmount,
        fulfillmentMethod: input.fulfillmentMethod,
        shippingAddressId: addr.id,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_PAYMENT',
        orderItems: {
          create: enrichedItems.map((item) => ({
            productId: item.productId,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: orderInclude,
    })

    // 5. Reserve the stock (reserve, don't deduct — deduction on payment success)
    await Promise.all(
      enrichedItems.map((item) =>
        tx.sellerInventory.update({
          where: { id: item.inventoryId },
          data: {
            reservedQuantity: { increment: item.quantity },
            availableQuantity: { decrement: item.quantity },
          },
        })
      )
    )

    return order
  })
}

/** Get all orders for a buyer */
export const getBuyerOrders = async (buyerId: string, page: PageParams, status?: string) => {
  const where: Prisma.OrderWhereInput = {
    buyerId,
    ...(status ? { orderStatus: status as Prisma.EnumOrderStatusFilter } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.order.count({ where }),
  ])
  return { items, meta: pageMeta(page, total) }
}

export const getBuyerOrder = async (buyerId: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  })
  if (!order || order.buyerId !== buyerId) throw AppError.notFound('Order not found')
  return order
}

/** Cancel an unpaid order — releases reserved stock */
export const cancelOrder = async (buyerId: string, orderId: string) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    })
    if (!order || order.buyerId !== buyerId) throw AppError.notFound('Order not found')
    if (!['PENDING_PAYMENT', 'PAID'].includes(order.orderStatus)) {
      throw AppError.badRequest('Order cannot be cancelled at this stage')
    }

    // Release reserved stock
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

    return tx.order.update({
      where: { id: orderId },
      data: { orderStatus: 'CANCELLED', paymentStatus: 'FAILED' },
    })
  })
}

/** Get one order with full details (used by seller + admin too via service) */
export const getOrderById = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  })
  if (!order) throw AppError.notFound('Order not found')
  return order
}
