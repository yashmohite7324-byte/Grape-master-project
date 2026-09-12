import { Router } from 'express'
import * as controller from './auth.controller'
import { validate } from '../../middleware/validate'
import { authenticate } from '../../middleware/auth'
import { registerSchema, loginSchema } from './auth.validation'

const router = Router()

router.post('/register', validate(registerSchema), controller.register)
router.post('/login', validate(loginSchema), controller.login)
router.get('/me', authenticate, controller.me)

export default router
