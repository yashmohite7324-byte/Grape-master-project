import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env, isProd } from './config/env'
import apiRoutes from './routes'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

const app: Application = express()

// Security & core middleware
app.use(helmet())
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(compression())
if (!isProd) app.use(morgan('dev'))

// Rate limiting: global + stricter on auth
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }))

// Health check
app.get('/health', (_req: Request, res: Response) =>
  res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() })
)

// API
app.use('/api', apiRoutes)

// 404 + error handling (must be last)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
