import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes'
import farmerRoutes from '../modules/farmer/farmer.routes'
import brokerRoutes from '../modules/broker/broker.routes'
import sellerRoutes from '../modules/seller/seller.routes'
import productsRoutes from '../modules/products/products.routes'
import ordersRoutes from '../modules/orders/orders.routes'
import paymentsRoutes from '../modules/payments/payments.routes'
import notificationsRoutes from '../modules/notifications/notifications.routes'
import recommendationsRoutes from '../modules/recommendations/recommendations.routes'
import profileRoutes from '../modules/profile/profile.routes'
import adminRoutes from '../modules/admin/admin.routes'
import dealersRoutes from '../modules/dealers/dealers.routes'

const router = Router()

router.get('/status', (_req, res) =>
  res.json({
    service: 'Grape Master API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/auth', '/farmer', '/broker', '/seller',
      '/products', '/orders', '/payments',
      '/notifications', '/recommendations',
      '/profile', '/admin', '/dealers',
    ],
  })
)

router.use('/auth', authRoutes)
router.use('/farmer', farmerRoutes)
router.use('/broker', brokerRoutes)
router.use('/seller', sellerRoutes)
router.use('/products', productsRoutes)
router.use('/orders', ordersRoutes)
router.use('/payments', paymentsRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/recommendations', recommendationsRoutes)
router.use('/auth', profileRoutes)
router.use('/admin', adminRoutes)
router.use('/dealers', dealersRoutes)

export default router
