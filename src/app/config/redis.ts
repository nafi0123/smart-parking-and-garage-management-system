import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

const redisClient = new Redis(redisUrl || '', {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 2) {
      return null;
    }
    return Math.min(times * 200, 1000);
  },
});

redisClient.on('connect', () => {
  console.log('🔴 Connected to Redis Cloud successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Connection Error:', (err as any)?.message || err);
});

export default redisClient;
