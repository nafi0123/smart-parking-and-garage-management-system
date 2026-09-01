import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

redisClient.on('connect', () => {
  console.log('🔴 Connected to Redis Cloud successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

export default redisClient;
