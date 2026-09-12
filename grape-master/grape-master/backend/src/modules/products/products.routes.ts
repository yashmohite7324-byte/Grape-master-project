import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate'
import { optionalAuth } from '../../middleware/auth'
import { toSkipTake, pageMeta, paginationQuery } from '../../utils/pagination'
import { AppError } from '../../utils/AppError'

const router = Router()

// GET /products — public browsable catalogue (fertilizers)
router.get(
  '/',
  optionalAuth,
  validate(z.object({
    query: paginationQuery.extend({
      search: z.string().optional(),
      category: z.string().optional(),
      minPrice: z.coerce.number().positive().optional(),
      maxPrice: z.coerce.number().positive().optional(),
      sellerId: z.string().optional(),
    }),
  })),
  catchAsync(async (req, res) => {
    const { page, limit, search, category, minPrice, maxPrice, sellerId } =
      req.query as unknown as {
        page: number; limit: number; search?: string; category?: string
        minPrice?: number; maxPrice?: number; sellerId?: string
      }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search
        ? { OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
          ] }
        : {}),
      ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
      ...(minPrice || maxPrice ? { price: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } } : {}),
      ...(sellerId ? { sellerId } : {}),
      inventory: { some: { availableQuantity: { gt: 0 } } },
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: { include: { profile: true, sellerProfile: true } },
          inventory: true,
        },
        orderBy: { createdAt: 'desc' },
        ...toSkipTake({ page, limit }),
      }),
      prisma.product.count({ where }),
    ])

    sendSuccess(res, items, 'Products', 200, pageMeta({ page, limit }, total))
  })
)

// GET /products/:id — public product detail
router.get(
  '/:id',
  optionalAuth,
  catchAsync(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { include: { profile: true, sellerProfile: true } },
        inventory: true,
      },
    })
    if (!product) throw AppError.notFound('Product not found')
    sendSuccess(res, product, 'Product detail')
  })
)

export default router
