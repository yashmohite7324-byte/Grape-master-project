import { Request, Response } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import * as brokerService from './broker.service'

// ── Marketplace ──
export const browseMarketplace = catchAsync(async (req: Request, res: Response) => {
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const q = req.query as any
  const { items, meta } = await brokerService.browseMarketplace(
    { page: pageNum, limit: limitNum },
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
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const status = req.query.status as any
  const { items, meta } = await brokerService.getMyOffers(req.user!.id, { page: pageNum, limit: limitNum }, status)
  sendSuccess(res, items, 'Your offers', 200, meta)
})

export const getPublicOffers = catchAsync(async (req: Request, res: Response) => {
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const { items, meta } = await brokerService.getAllPublicOffers({ page: pageNum, limit: limitNum })
  sendSuccess(res, items, 'Public market offers', 200, meta)
})

export const withdrawOffer = catchAsync(async (req: Request, res: Response) => {
  const offer = await brokerService.withdrawOffer(req.user!.id, req.params.id)
  sendSuccess(res, offer, 'Offer withdrawn')
})

// ── Inventory ──
export const getInventory = catchAsync(async (req: Request, res: Response) => {
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const { items, meta, summary } = await brokerService.getInventory(req.user!.id, { page: pageNum, limit: limitNum })
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
