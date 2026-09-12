import { Request, Response } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import * as sellerService from './seller.service'

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await sellerService.createProduct(req.user!.id, req.body)
  sendSuccess(res, product, 'Product created', 201)
})

export const getMyProducts = catchAsync(async (req: Request, res: Response) => {
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const { items, meta } = await sellerService.getMyProducts(req.user!.id, { page: pageNum, limit: limitNum })
  sendSuccess(res, items, 'Products', 200, meta)
})

export const getMyProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await sellerService.getMyProduct(req.user!.id, req.params.id)
  sendSuccess(res, product, 'Product detail')
})

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await sellerService.updateProduct(req.user!.id, req.params.id, req.body)
  sendSuccess(res, product, 'Product updated')
})

export const toggleProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await sellerService.toggleProduct(req.user!.id, req.params.id)
  sendSuccess(res, product, product.isActive ? 'Product activated' : 'Product deactivated')
})

export const adjustStock = catchAsync(async (req: Request, res: Response) => {
  const inv = await sellerService.adjustStock(req.user!.id, req.params.id, req.body.adjustment)
  sendSuccess(res, inv, 'Stock updated')
})

export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const pageNum = Number(req.query.page) || 1
  const limitNum = Number(req.query.limit) || 20
  const status = req.query.status as string
  const { items, meta } = await sellerService.getMyOrders(req.user!.id, { page: pageNum, limit: limitNum }, status)
  sendSuccess(res, items, 'Seller orders', 200, meta)
})

export const getMyOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await sellerService.getMyOrder(req.user!.id, req.params.id)
  sendSuccess(res, order, 'Order detail')
})

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const order = await sellerService.updateOrderStatus(req.user!.id, req.params.id, req.body.status)
  sendSuccess(res, order, 'Order status updated')
})
