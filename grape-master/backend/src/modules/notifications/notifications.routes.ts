import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import { prisma } from '../../config/prisma'
import { toSkipTake, pageMeta, paginationQuery } from '../../utils/pagination'
import { AppError } from '../../utils/AppError'

const router = Router()
router.use(authenticate)

// GET /notifications — paginated list for current user
router.get(
  '/',
  validate(z.object({ query: paginationQuery.extend({ unread: z.coerce.boolean().optional() }) })),
  catchAsync(async (req, res) => {
    const { page, limit, unread } = req.query as unknown as { page: number; limit: number; unread?: boolean }
    const where = { userId: req.user!.id, ...(unread ? { isRead: false } : {}) }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake({ page, limit }),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ])

    sendSuccess(res, { items, unreadCount }, 'Notifications', 200, pageMeta({ page, limit }, total))
  })
)

// PATCH /notifications/:id/read — mark one notification as read
router.patch(
  '/:id/read',
  catchAsync(async (req, res) => {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } })
    if (!notif || notif.userId !== req.user!.id) throw AppError.notFound('Notification not found')

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    })
    sendSuccess(res, updated, 'Marked as read')
  })
)

// PATCH /notifications/read-all — mark all as read
router.patch(
  '/read-all',
  catchAsync(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    sendSuccess(res, null, 'All notifications marked as read')
  })
)

export default router
