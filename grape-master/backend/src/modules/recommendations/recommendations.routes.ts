import { Router } from 'express'
import { z } from 'zod'
import { authenticate, optionalAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import { prisma } from '../../config/prisma'
import { logger } from '../../utils/logger'

const router = Router()

/**
 * GET /recommendations — personalized fertilizer recommendations for farmers.
 *
 * Strategy (rule-based until the Python ML service is live):
 *   1. Look at the farmer's past purchases (order history).
 *   2. Find products in the same categories they've bought.
 *   3. Fill remaining slots with top-selling products they haven't bought.
 */
router.get(
  '/',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user!.id
    const limit = 8

    // Fetch pre-generated recommendations from DB (populated by ML service)
    const stored = await prisma.recommendation.findMany({
      where: { userId },
      include: { product: { include: { inventory: true, seller: { include: { profile: true } } } } },
      orderBy: { score: 'desc' },
      take: limit,
    })

    if (stored.length >= 4) {
      sendSuccess(res, stored, 'Personalised recommendations')
      return
    }

    // Fallback: rule-based content recommendations
    const pastPurchases = await prisma.orderItem.findMany({
      where: { order: { buyerId: userId, paymentStatus: 'SUCCESS' } },
      include: { product: true },
      take: 20,
    })

    const purchasedCategories = [...new Set(
      pastPurchases
        .map((p) => p.product?.category)
        .filter((category): category is string => Boolean(category))
    )]
    const purchasedProductIds = pastPurchases.map((p) => p.productId).filter(Boolean) as string[]

    // Products in same categories (exclude already purchased)
    const recommended = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: purchasedProductIds },
        ...(purchasedCategories.length > 0 ? { category: { in: purchasedCategories } } : {}),
        inventory: { some: { availableQuantity: { gt: 0 } } },
      },
      include: { inventory: true, seller: { include: { profile: true, sellerProfile: true } } },
      take: limit,
    })

    // If not enough, fill with popular products
    if (recommended.length < limit) {
      const popular = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: [...purchasedProductIds, ...recommended.map((p) => p.id)] },
          inventory: { some: { availableQuantity: { gt: 0 } } },
        },
        include: { inventory: true, seller: { include: { profile: true, sellerProfile: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit - recommended.length,
      })
      recommended.push(...popular)
    }

    const response = recommended.map((p) => ({
      id: p.id,
      productId: p.id,
      modelVersion: 'rule-based-v1',
      score: purchasedCategories.includes(p.category) ? 0.85 : 0.65,
      reason: purchasedCategories.includes(p.category)
        ? `Based on your ${p.category} purchase history`
        : 'Popular with farmers in your area',
      product: p,
    }))

    sendSuccess(res, response, 'Recommendations')
  })
)

// POST /recommendations/events — log user behaviour (view, click, add-to-cart, etc.)
router.post(
  '/events',
  optionalAuth,
  validate(z.object({
    body: z.object({
      eventType: z.enum([
        'PRODUCT_VIEW', 'SEARCH', 'CLICK', 'ADD_TO_CART',
        'REMOVE_FROM_CART', 'PURCHASE', 'WISHLIST',
        'RECOMMENDATION_VIEW', 'RECOMMENDATION_CLICK',
      ]),
      productId: z.string().optional(),
      sessionId: z.string().optional(),
      location: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  })),
  catchAsync(async (req, res) => {
    if (!req.user) { sendSuccess(res, null, 'Event ignored (unauthenticated)'); return }

    await prisma.userBehavior.create({
      data: {
        userId: req.user.id,
        eventType: req.body.eventType,
        productId: req.body.productId,
        sessionId: req.body.sessionId,
        location: req.body.location,
        metadata: req.body.metadata,
      },
    })

    logger.info(`Behavior event recorded: ${req.body.eventType}`, { userId: req.user.id })
    sendSuccess(res, null, 'Event recorded')
  })
)

// POST /recommendations/feedback — rating/click feedback on a recommendation
router.post(
  '/feedback',
  authenticate,
  validate(z.object({
    body: z.object({
      recommendationId: z.string().optional(),
      productId: z.string(),
      action: z.enum(['CLICK', 'ADD_TO_CART', 'PURCHASE', 'DISMISS']),
    }),
  })),
  catchAsync(async (req, res) => {
    // Log as a behavior event
    await prisma.userBehavior.create({
      data: {
        userId: req.user!.id,
        productId: req.body.productId,
        eventType: req.body.action === 'CLICK' ? 'RECOMMENDATION_CLICK' : 'RECOMMENDATION_VIEW',
        metadata: { action: req.body.action, recommendationId: req.body.recommendationId },
      },
    })
    sendSuccess(res, null, 'Feedback recorded')
  })
)

export default router
