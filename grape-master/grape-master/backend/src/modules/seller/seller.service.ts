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

// ─── Inventory ───

export const adjustStock = async (sellerId: string, inventoryId: string, adjustment: number) => {
  const inv = await prisma.sellerInventory.findUnique({ where: { id: inventoryId } })
  if (!inv || inv.sellerId !== sellerId) throw AppError.notFound('Inventory record not found')

  const newQty = inv.quantity + adjustment
  const newAvail = inv.availableQuantity + adjustment
  if (newAvail < 0) throw AppError.badRequest(`Cannot remove more than available stock (${inv.availableQuantity})`)

  return prisma.sellerInventory.update({
    where: { id: inventoryId },
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
