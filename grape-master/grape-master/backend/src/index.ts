import http from 'http'
import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'
import { connectRedis } from './config/redis'
import { initWebSocketServer } from './config/websocket'
import { logger } from './utils/logger'

const server = http.createServer(app)

// Real-time WebSocket server
initWebSocketServer(server)

const start = async () => {
  // Connect Redis first (needed for pub/sub)
  await connectRedis()

  server.listen(env.PORT, () => {
    logger.info(`🍇 Grape Master API on http://localhost:${env.PORT}`)
    logger.info(`   WebSocket on ws://localhost:${env.PORT}/ws`)
    logger.info(`   Environment: ${env.NODE_ENV}`)
  })
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.warn(`${signal} received, shutting down…`)
  server.close(async () => {
    await prisma.$disconnect()
    logger.info('Closed HTTP/WS server and database')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', r))

start()
