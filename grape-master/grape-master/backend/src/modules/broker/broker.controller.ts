import { Request, Response } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import * as brokerService from './broker.service'

// ── Marketplace ──
export const browseMarketplace = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as unknown as {
    page: number
    limit: number
    cropType?: string
    variety?: string
    minQuantity?: number
    maxPrice?: number
    district?: string
    state?: string
    sort: 'newest' | 'priceAsc' | 'priceDesc' | 'quantityDesc'
  }
  const { items, meta } = await brokerService.browseMarketplace(
    { page: q.page, limit: q.limit },
    q
  )
  sendSuccess(res, items, 'Marketplace listings', 200, meta)
})

export const getMarketplaceListing = catchAsync(async (req: Request, res: Response) => {
  const listing = await brokerService.getMarketplaceListing(req.params.id)
  sendSuccess(res, listing, 'Listing detail')
})

// ── Offers ──
export const makeOffer = catchAsync(async (req: Request, res: Response) => {
  const offer = await brokerService.makeOffer(req.user!.id, req.params.id, req.body)
  sendSuccess(res, offer, 'Offer submitted', 201)
})

export const getMyOffers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as unknown as {
    page: number
    limit: number
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  }
  const { items, meta } = await brokerService.getMyOffers(req.user!.id, { page, limit }, status)
  sendSuccess(res, items, 'Your offers', 200, meta)
})

export const withdrawOffer = catchAsync(async (req: Request, res: Response) => {
  const offer = await brokerService.withdrawOffer(req.user!.id, req.params.id)
  sendSuccess(res, offer, 'Offer withdrawn')
})

// ── Inventory ──
export const getInventory = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number }
  const { items, meta, summary } = await brokerService.getInventory(req.user!.id, { page, limit })
  sendSuccess(res, { items, summary }, 'Broker inventory', 200, meta)
})

export const updateSellingPrice = catchAsync(async (req: Request, res: Response) => {
  const item = await brokerService.updateSellingPrice(
    req.user!.id,
    req.params.id,
    req.body.sellingPrice
  )
  sendSuccess(res, item, 'Selling price updated')
})
