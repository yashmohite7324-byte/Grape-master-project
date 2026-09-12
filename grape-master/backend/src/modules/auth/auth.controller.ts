import { Request, Response } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import * as authService from './auth.service'

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body)
  sendSuccess(res, result, 'Registration successful', 201)
})

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body)
  sendSuccess(res, result, 'Login successful')
})

export const me = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id)
  sendSuccess(res, user, 'Current user')
})
