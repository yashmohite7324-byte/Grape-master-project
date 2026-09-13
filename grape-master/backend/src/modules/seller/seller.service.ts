import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { toSkipTake, pageMeta, type PageParams } from '../../utils/pagination'
import type { CreateProductInput, UpdateProductInput } from './seller.validation'

// ─── Products ───

export const createProduct = async (sellerId: string, input: CreateProductInput) => {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sellerId,
        name: input.name,
        description: input.description,
        category: input.category,
        brand: input.brand,
        unit: input.unit,
        price: input.price,
        images: input.images ?? [],
        productType: 'FERTILIZER',
      },
    })

    // Create initial inventory record
    await tx.sellerInventory.create({
      data: {
        sellerId,
        productId: product.id,
        quantity: input.initialStock,
        availableQuantity: input.initialStock,
        reservedQuantity: 0,
      },
    })

    return product
  })
}

export const getMyProducts = async (sellerId: string, page: PageParams) => {
  const where: Prisma.ProductWhereInput = { sellerId }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { inventory: true },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.product.count({ where }),
  ])
  return { items, meta: pageMeta(page, total) }
}

export const getMyProduct = async (sellerId: string, productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { inventory: true },
  })
  if (!product || product.sellerId !== sellerId) throw AppError.notFound('Product not found')
  return product
}

export const updateProduct = async (sellerId: string, productId: string, input: UpdateProductInput) => {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.sellerId !== sellerId) throw AppError.notFound('Product not found')

  return prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      brand: input.brand,
      unit: input.unit,
      price: input.price,
      isActive: input.isActive,
      images: input.images,
    },
  })
}

export const toggleProduct = async (sellerId: string, productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.sellerId !== sellerId) throw AppError.notFound('Product not found')
  return prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  })
}

export const adjustStock = async (sellerId: string, idOrProductId: string, adjustment: number) => {
  let inv = await prisma.sellerInventory.findFirst({
    where: { OR: [{ id: idOrProductId }, { productId: idOrProductId }], sellerId },
  })

  if (!inv) {
    const product = await prisma.product.findUnique({ where: { id: idOrProductId } })
    if (!product || product.sellerId !== sellerId) throw AppError.notFound('Product or Inventory record not found')

    const initialQty = Math.max(0, adjustment)
    inv = await prisma.sellerInventory.create({
      data: {
        sellerId,
        productId: product.id,
        quantity: initialQty,
        availableQuantity: initialQty,
        reservedQuantity: 0,
      },
    })
    return inv
  }

  const newQty = Math.max(0, inv.quantity + adjustment)
  const newAvail = Math.max(0, inv.availableQuantity + adjustment)

  return prisma.sellerInventory.update({
    where: { id: inv.id },
    data: { quantity: newQty, availableQuantity: newAvail },
  })
}

// ─── Orders ───

export const getMyOrders = async (sellerId: string, page: PageParams, status?: string) => {
  const where: Prisma.OrderWhereInput = {
    sellerId,
    ...(status ? { orderStatus: status as Prisma.EnumOrderStatusFilter } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        buyer: { include: { profile: true } },
        orderItems: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.order.count({ where }),
  ])
  return { items, meta: pageMeta(page, total) }
}

export const getMyOrder = async (sellerId: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { include: { profile: true } },
      orderItems: { include: { product: true } },
      receipt: true,
    },
  })
  if (!order || order.sellerId !== sellerId) throw AppError.notFound('Order not found')
  return order
}

export const updateOrderStatus = async (sellerId: string, orderId: string, newStatus: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.sellerId !== sellerId) throw AppError.notFound('Order not found')

  const allowed: Record<string, string[]> = {
    CONFIRMED: ['PROCESSING'],
    PROCESSING: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
    READY_FOR_PICKUP: ['DELIVERED'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: ['COMPLETED'],
  }

  const valid = allowed[order.orderStatus] ?? []
  if (!valid.includes(newStatus))
    throw AppError.badRequest(`Cannot move order from ${order.orderStatus} to ${newStatus}`)

  return prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: newStatus as Prisma.EnumOrderStatusFieldUpdateOperationsInput },
  })
}
