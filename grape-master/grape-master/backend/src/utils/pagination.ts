import { z } from 'zod'

/** Reusable query schema fragment for paginated list endpoints. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export interface PageParams {
  page: number
  limit: number
}

/** Convert page/limit into Prisma skip/take. */
export const toSkipTake = ({ page, limit }: PageParams) => ({
  skip: (page - 1) * limit,
  take: limit,
})

/** Build the meta object returned alongside paginated data. */
export const pageMeta = (params: PageParams, total: number) => ({
  page: params.page,
  limit: params.limit,
  total,
  totalPages: Math.ceil(total / params.limit),
})
