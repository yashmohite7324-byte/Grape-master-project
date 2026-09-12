import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { toSkipTake, pageMeta, type PageParams } from '../../utils/pagination'

// ─── Stats ───

export const getPlatformStats = async () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers, farmers, brokers, sellers, customers,
    totalOrders, pendingOrders, completedOrders, cancelledOrders,
    activeListings, totalListings,
    activeProducts, totalProducts,
    revenueTotal, revenueMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'FARMER' } }),
    prisma.user.count({ where: { role: 'BROKER' } }),
    prisma.user.count({ where: { role: 'FERTILIZER_SELLER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: { in: ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'] } } }),
    prisma.order.count({ where: { orderStatus: 'COMPLETED' } }),
    prisma.order.count({ where: { orderStatus: 'CANCELLED' } }),
    prisma.farmerListing.count({ where: { status: 'ACTIVE' } }),
    prisma.farmerListing.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.transaction.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { status: 'SUCCESS', createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ])

  return {
    users: { total: totalUsers, farmers, brokers, sellers, customers },
    orders: { total: totalOrders, pending: pendingOrders, completed: completedOrders, cancelled: cancelledOrders },
    listings: { active: activeListings, total: totalListings },
    products: { active: activeProducts, total: totalProducts },
    revenue: {
      total: revenueTotal._sum.amount ?? 0,
      thisMonth: revenueMonth._sum.amount ?? 0,
    },
  }
}

// ─── Users ───

export const getAllUsers = async (page: PageParams, role?: string, search?: string) => {
  const where: Prisma.UserWhereInput = {
    ...(role ? { role: role as Prisma.EnumUserRoleFilter } : {}),
    ...(search
      ? { OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { fullName: { contains: search, mode: 'insensitive' } } },
        ] }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: true, farmerProfile: true, brokerProfile: true, sellerProfile: true },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.user.count({ where }),
  ])

  // Strip passwords
  const safe = items.map(({ password: _pw, ...u }) => u)
  return { items: safe, meta: pageMeta(page, total) }
}

export const updateUser = async (userId: string, data: { isActive?: boolean }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw AppError.notFound('User not found')
  return prisma.user.update({ where: { id: userId }, data })
}

// ─── Orders ───

export const getAllOrders = async (page: PageParams, status?: string) => {
  const where: Prisma.OrderWhereInput = {
    ...(status ? { orderStatus: status as Prisma.EnumOrderStatusFilter } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        buyer: { include: { profile: true } },
        seller: { include: { profile: true, sellerProfile: true } },
        orderItems: { include: { product: true } },
        payment: true,
        transaction: true,
      },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.order.count({ where }),
  ])

  return { items, meta: pageMeta(page, total) }
}

// ─── Products ───

export const getAllProducts = async (page: PageParams, search?: string) => {
  const where: Prisma.ProductWhereInput = search
    ? { OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ] }
    : {}

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { seller: { include: { profile: true, sellerProfile: true } }, inventory: true },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.product.count({ where }),
  ])

  return { items, meta: pageMeta(page, total) }
}

export const adminUpdateProduct = async (productId: string, data: { isActive?: boolean; price?: number }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw AppError.notFound('Product not found')
  return prisma.product.update({ where: { id: productId }, data })
}

// ─── Transactions ───

export const getAllTransactions = async (page: PageParams) => {
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
        order: true,
      },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.transaction.count(),
  ])
  return { items, meta: pageMeta(page, total) }
}

// ─── Inventory overview ───

export const getInventoryOverview = async () => {
  const inventory = await prisma.sellerInventory.findMany({
    include: { product: true, seller: { include: { profile: true, sellerProfile: true } } },
    orderBy: { availableQuantity: 'asc' },
  })

  const lowStock = inventory.filter((i) => i.availableQuantity <= 10)
  return { inventory, lowStock }
}
