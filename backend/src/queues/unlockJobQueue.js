import { Queue } from 'bullmq';
import { redis } from '../config/redisClient.js';

export const unlockJobQueue = new Queue('unlockJob', {
    connection: redis 
});