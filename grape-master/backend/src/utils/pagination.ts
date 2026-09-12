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

/** Convert page/limit into Prisma skip/take. Guaranteed Int primitives. */
export const toSkipTake = (params?: Partial<PageParams>) => {
  const pageNum = Number(params?.page)
  const limitNum = Number(params?.limit)
  const p = Math.max(1, Math.floor(isNaN(pageNum) ? 1 : pageNum))
  const l = Math.max(1, Math.min(200, Math.floor(isNaN(limitNum) ? 20 : limitNum)))
  return {
    skip: Math.floor((p - 1) * l),
    take: Math.floor(l),
  }
}

/** Build the meta object returned alongside paginated data. */
export const pageMeta = (params: PageParams, total: number) => ({
  page: params.page,
  limit: params.limit,
  total,
  totalPages: Math.ceil(total / params.limit),
})
