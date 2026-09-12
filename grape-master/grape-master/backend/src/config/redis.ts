import Redis from 'ioredis'
import { logger } from '../utils/logger'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

/** Publisher — sends events */
export const redisPublisher = new Redis(REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
})

/** Subscriber — receives events */
export const redisSubscriber = new Redis(REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
})

redisPublisher.on('error', (e) => logger.warn('Redis publisher error', e.message))
redisSubscriber.on('error', (e) => logger.warn('Redis subscriber error', e.message))

/** Channel prefix for user-scoped notifications */
export const userChannel = (userId: string) => `gm:user:${userId}`

/** Channel prefix for role-scoped broadcasts */
export const roleChannel = (role: string) => `gm:role:${role}`

/** Publish a notification payload to a user's channel */
export const publishNotification = async (
  userId: string,
  payload: {
    type: string
    title: string
    message: string
    data?: Record<string, unknown>
  }
) => {
  try {
    await redisPublisher.publish(userChannel(userId), JSON.stringify(payload))
  } catch (e) {
    logger.warn('Failed to publish notification', e)
  }
}

/** Connect both clients (called once at startup) */
export const connectRedis = async () => {
  await Promise.all([
    redisPublisher.connect().catch(() => {}),
    redisSubscriber.connect().catch(() => {}),
  ])
  logger.info('Redis connected')
}
