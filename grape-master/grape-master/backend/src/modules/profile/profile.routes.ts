import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'

const router = Router()
router.use(authenticate)

// ── Profile ──

const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    mobileNumber: z.string().min(10).optional(),
    village: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
})

router.patch(
  '/profile',
  validate(updateProfileSchema),
  catchAsync(async (req, res) => {
    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        fullName: req.body.fullName ?? '',
        mobileNumber: req.body.mobileNumber ?? '',
        ...req.body,
      },
      update: req.body,
    })
    sendSuccess(res, profile, 'Profile updated')
  })
)

// ── Addresses ──

const addressSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    mobileNumber: z.string().min(10),
    addressLine: z.string().min(3),
    village: z.string().min(1),
    district: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().length(6),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isDefault: z.boolean().default(false),
    addressType: z.string().optional(),
  }),
})

router.get(
  '/addresses',
  catchAsync(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    sendSuccess(res, addresses, 'Your addresses')
  })
)

router.post(
  '/addresses',
  validate(addressSchema),
  catchAsync(async (req, res) => {
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      })
    }
    const address = await prisma.address.create({
      data: { userId: req.user!.id, ...req.body },
    })
    sendSuccess(res, address, 'Address added', 201)
  })
)

router.patch(
  '/addresses/:id',
  catchAsync(async (req, res) => {
    const addr = await prisma.address.findUnique({ where: { id: req.params.id } })
    if (!addr || addr.userId !== req.user!.id) throw AppError.notFound('Address not found')
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      })
    }
    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: req.body,
    })
    sendSuccess(res, updated, 'Address updated')
  })
)

router.delete(
  '/addresses/:id',
  catchAsync(async (req, res) => {
    const addr = await prisma.address.findUnique({ where: { id: req.params.id } })
    if (!addr || addr.userId !== req.user!.id) throw AppError.notFound('Address not found')
    await prisma.address.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Address deleted')
  })
)

export default router
