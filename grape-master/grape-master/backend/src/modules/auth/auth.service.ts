import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { signToken } from '../../middleware/auth'
import type { RegisterInput, LoginInput } from './auth.validation'

const SALT_ROUNDS = 10

/** Shape returned to the client (never includes the password hash). */
const toPublicUser = (
  user: { id: string; email: string; role: string; profile: { fullName: string; mobileNumber: string } | null }
) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: user.profile?.fullName ?? null,
  mobileNumber: user.profile?.mobileNumber ?? null,
})

/**
 * Register a user. Creates the base user, the shared profile, and the
 * role-specific profile in a single transaction so we never end up with
 * a half-created account.
 */
export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw AppError.conflict('An account with this email already exists')

  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS)

  const roleProfile: Prisma.UserCreateInput = {
    email: input.email,
    password: hashed,
    role: input.role,
    profile: {
      create: {
        fullName: input.fullName,
        mobileNumber: input.mobileNumber,
        village: input.village,
        district: input.district,
        state: input.state,
        pincode: input.pincode,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    },
  }

  if (input.role === 'FARMER') {
    roleProfile.farmerProfile = {
      create: { primaryCrop: input.primaryCrop!, farmName: input.farmName },
    }
  } else if (input.role === 'BROKER') {
    roleProfile.brokerProfile = {
      create: { brokerName: input.fullName, companyName: input.companyName },
    }
  } else if (input.role === 'FERTILIZER_SELLER') {
    roleProfile.sellerProfile = {
      create: { sellerName: input.fullName, companyName: input.companyName },
    }
  }

  const user = await prisma.user.create({
    data: roleProfile,
    include: { profile: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
    },
  })

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  return { user: toPublicUser(user), token }
}

/** Authenticate with email + password and return a signed JWT. */
export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { profile: true },
  })

  // Same message for missing user vs wrong password (avoids user enumeration).
  if (!user) throw AppError.unauthorized('Invalid email or password')
  if (!user.isActive) throw AppError.forbidden('This account has been deactivated')

  const ok = await bcrypt.compare(input.password, user.password)
  if (!ok) throw AppError.unauthorized('Invalid email or password')

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  return { user: toPublicUser(user), token }
}

/** Fetch the current user's full profile bundle. */
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      farmerProfile: true,
      brokerProfile: true,
      sellerProfile: true,
    },
  })
  if (!user) throw AppError.notFound('User not found')

  const { password: _password, ...safe } = user
  return safe
}
