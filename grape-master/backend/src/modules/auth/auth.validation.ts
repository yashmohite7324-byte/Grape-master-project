import { z } from 'zod'

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      role: z.enum(['FARMER', 'BROKER', 'FERTILIZER_SELLER', 'CUSTOMER']),
      fullName: z.string().min(2),
      mobileNumber: z.string().min(10).max(15),
      village: z.string().optional(),
      district: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      // role-specific (optional)
      farmName: z.string().optional(),
      primaryCrop: z.string().optional(),
      companyName: z.string().optional(),
    })
    .refine((d) => d.role !== 'FARMER' || !!d.primaryCrop, {
      message: 'primaryCrop is required for farmers',
      path: ['primaryCrop'],
    }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1, 'Password is required'),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']
