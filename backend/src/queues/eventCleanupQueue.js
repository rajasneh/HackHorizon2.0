import { Queue } from 'bullmq';
import { redis } from '../config/redisClient.js';

export const eventCleanupQueue = new Queue('eventCleanup', {
    connection: redis 
});