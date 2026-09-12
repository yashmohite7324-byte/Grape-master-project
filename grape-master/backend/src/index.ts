import http from 'http'
import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'
import { logger } from './utils/logger'
import { initializeSocket } from './lib/socket'
import { connectRedis } from './lib/redis'

const server = http.createServer(app)
initializeSocket(server)

server.listen(env.PORT, async () => {
  logger.info(`🍇 Grape Master API running on http://localhost:${env.PORT}`)
  logger.info(`   Environment: ${env.NODE_ENV}`)
  // Connect Redis (non-blocking — app works without it)
  await connectRedis().catch(() => {})
})

// Graceful shutdown: close HTTP server, then the DB pool.
const shutdown = async (signal: string) => {
  logger.warn(`${signal} received, shutting down...`)
  server.close(async () => {
    await prisma.$disconnect()
    logger.info('Closed HTTP server and database connections')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason)
})
