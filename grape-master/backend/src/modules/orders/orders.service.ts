import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { toSkipTake, pageMeta, type PageParams } from '../../utils/pagination'
import { createAndSendNotification } from '../../lib/notify'
import type { CreateOrderInput } from './orders.validation'

const orderInclude = {
  buyer: { include: { profile: true } },
  seller: { include: { profile: true, sellerProfile: true } },
  shippingAddress: true,
  orderItems: { include: { product: true } },
  payment: true,
}

const generateOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

// Static distance default if not supplied
const DELIVERY_DISTANCE_KM = 8

const calcDeliveryCharge = (km: number): number => {
  if (km <= 5) return 0
  if (km <= 10) return 40
  if (km <= 35) return 140
  if (km <= 50) return 200
  return 200 + (km - 50) * 6
}

export const createOrder = async (reqUser: { id: string } | undefined, input: CreateOrderInput & { guestPhone?: string; guestName?: string; distanceKm?: number }) => {
  let buyerId = reqUser?.id

  const phoneToUse = input.guestPhone || input.shippingAddress?.mobileNumber

  if (!buyerId) {
    if (!phoneToUse) {
      throw AppError.badRequest('Mobile number is required for guest checkout')
    }
    const guestEmail = `guest_${phoneToUse}@grapemaster.com`
    let guestUser = await prisma.user.findFirst({
      where: { OR: [{ phone: phoneToUse }, { email: guestEmail }] }
    })
    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          phone: phoneToUse,
          email: guestEmail,
          role: 'CUSTOMER',
          profile: {
            create: {
              fullName: input.guestName || input.shippingAddress?.fullName || 'Guest Customer',
              mobileNumber: phoneToUse
            }
          }
        }
      })
    }
    buyerId = guestUser.id
  }

  const distanceKm = input.distanceKm || DELIVERY_DISTANCE_KM
  if (input.fulfillmentMethod === 'DELIVERY' && distanceKm > 100) {
    throw AppError.badRequest('Home delivery is not available for locations >100km away. Please select Dealer Pickup.')
  }

  const order = await prisma.$transaction(async (tx) => {
    // 1. Enrich items & check inventory
    const enrichedItems = await Promise.all(
      input.items.map(async (item: any) => {
        let inv = item.inventoryId
          ? await tx.sellerInventory.findUnique({
              where: { id: item.inventoryId },
              include: { product: true },
            })
          : item.productId
          ? await tx.sellerInventory.findFirst({
              where: { productId: item.productId },
              include: { product: true },
            })
          : null

        let product = inv?.product ? inv.product : null

        if (!product && item.productId) {
          product = await tx.product.findUnique({ where: { id: item.productId } })
        }

        if (!product) {
          throw AppError.notFound(`Product or inventory not found for item ${item.productId || item.inventoryId}`)
        }

        const unitPrice = item.unitPrice || product.price

        return {
          inventoryId: inv?.id ?? undefined,
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
        }
      })
    )

    // 2. Calculations
    const subtotal = enrichedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    const deliveryCharge = input.fulfillmentMethod === 'DELIVERY' ? calcDeliveryCharge(distanceKm) : 0
    const tax = 0
    const discount = input.discount ?? 0
    const totalAmount = subtotal + deliveryCharge + tax - discount

    // 3. Create or find shipping address
    const addr = await tx.address.create({
      data: {
        userId: buyerId!,
        fullName: input.shippingAddress.fullName || 'Valued Customer',
        mobileNumber: input.shippingAddress.mobileNumber || '9000000000',
        addressLine: (input.shippingAddress as any).addressLine || (input.shippingAddress as any).line1 || 'Farm Address',
        village: input.shippingAddress.village || 'Nashik',
        district: input.shippingAddress.district || 'Nashik',
        state: input.shippingAddress.state || 'Maharashtra',
        pincode: input.shippingAddress.pincode || '422001',
        isDefault: false,
      },
    })

    // 4. Create order
    const createdOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        buyerId: buyerId!,
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
        distanceKm,
        orderItems: {
          create: enrichedItems.map((item) => ({
            productId: item.productId,
            inventoryId: item.inventoryId ?? undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: orderInclude,
    })

    // 5. Reserve stock
    await Promise.all(
      enrichedItems.map((item) => {
        if (item.inventoryId) {
          return tx.sellerInventory.update({
            where: { id: item.inventoryId },
            data: {
              reservedQuantity: { increment: item.quantity },
              availableQuantity: { decrement: item.quantity },
            },
          }).catch(() => undefined)
        } else if (item.productId) {
          return tx.sellerInventory.updateMany({
            where: { productId: item.productId },
            data: {
              reservedQuantity: { increment: item.quantity },
              availableQuantity: { decrement: item.quantity },
            },
          }).catch(() => undefined)
        }
        return Promise.resolve()
      })
    )

    return createdOrder
  })

  await createAndSendNotification({
    userId: order.sellerId,
    title: 'New order placed',
    message: `Order ${order.orderNumber} is awaiting payment.`,
    type: 'ORDER',
    data: { orderId: order.id, orderNumber: order.orderNumber },
  }).catch(() => undefined)

  return order
}

export const getBuyerOrders = async (buyerId: string, page: PageParams, status?: string) => {
  const where: Prisma.OrderWhereInput = {
    buyerId,
    ...(status ? { orderStatus: status as any } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
      ...toSkipTake(page),
    }),
    prisma.order.count({ where }),
  ])

  return { items, meta: pageMeta(page, total) }
}

export const getOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  })

  if (!order) throw AppError.notFound('Order not found')
  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw AppError.forbidden('You do not have access to this order')
  }

  return order
}

export const getBuyerOrder = async (userId: string, orderId: string) => {
  return getOrderById(userId, orderId)
}

export const cancelOrder = async (userId: string, orderId: string) => {
  await getOrderById(userId, orderId)
  return prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: 'CANCELLED' },
  })
}
