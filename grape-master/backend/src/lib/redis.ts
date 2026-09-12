import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const createClient = (name: string) => {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null; // stop retrying
      return Math.min(times * 500, 3000);
    },
    lazyConnect: true,
  });
  client.on('error', (err) => console.warn(`Redis ${name} error:`, err.message));
  client.on('connect', () => console.log(`Redis ${name} connected`));
  return client;
};

// Main client for caching/general usage
export const redisClient = createClient('Client');

// Pub client for emitting events
export const pubClient = createClient('Pub');

// Sub client for listening to events
export const subClient = createClient('Sub');

export async function connectRedis() {
  try {
    await Promise.all([
      redisClient.connect(),
      pubClient.connect(),
      subClient.connect(),
    ]);
    console.log('✅ Redis connected (all clients)');
  } catch (err: any) {
    console.warn('⚠️  Redis not available — real-time features disabled:', err.message);
  }
}
