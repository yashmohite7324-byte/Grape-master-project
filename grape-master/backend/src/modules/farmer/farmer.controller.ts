import { Request, Response } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import * as farmerService from './farmer.service'

// ── Listings ──
export const createListing = catchAsync(async (req: Request, res: Response) => {
  const listing = await farmerService.createListing(req.user!.id, req.body)
  sendSuccess(res, listing, 'Listing created', 201)
})

export const getMyListings = catchAsync(async (req: Request, res: Response) => {
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const status = req.query.status as any
  const { items, meta } = await farmerService.getMyListings(req.user!.id, { page: pageNum, limit: limitNum }, status)
  sendSuccess(res, items, 'Your listings', 200, meta)
})

export const getMyListing = catchAsync(async (req: Request, res: Response) => {
  const listing = await farmerService.getMyListing(req.user!.id, req.params.id)
  sendSuccess(res, listing, 'Listing detail')
})

export const updateListing = catchAsync(async (req: Request, res: Response) => {
  const listing = await farmerService.updateListing(req.user!.id, req.params.id, req.body)
  sendSuccess(res, listing, 'Listing updated')
})

export const cancelListing = catchAsync(async (req: Request, res: Response) => {
  const listing = await farmerService.cancelListing(req.user!.id, req.params.id)
  sendSuccess(res, listing, 'Listing cancelled')
})

// ── Offers ──
export const getReceivedOffers = catchAsync(async (req: Request, res: Response) => {
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const { items, meta } = await farmerService.getReceivedOffers(req.user!.id, { page: pageNum, limit: limitNum })
  sendSuccess(res, items, 'Offers received', 200, meta)
})

export const acceptOffer = catchAsync(async (req: Request, res: Response) => {
  const result = await farmerService.acceptOffer(req.user!.id, req.params.id)
  sendSuccess(res, result, 'Offer accepted')
})

export const rejectOffer = catchAsync(async (req: Request, res: Response) => {
  const result = await farmerService.rejectOffer(req.user!.id, req.params.id)
  sendSuccess(res, result, 'Offer rejected')
})
