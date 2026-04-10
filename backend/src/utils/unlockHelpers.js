import { redis } from "../config/redisClient.js"; // your initialized Redis client

// Unlocks the seats in bullmq
export const unlockSeats = async (eventId, seats, userId) => {
  try {
    const redisKeys = seats.map(seatId => `locked:seat:${eventId}:${seatId}`);
    const lockOwners = await redis.mget(redisKeys);
    
    const pipeline = redis.multi();
    redisKeys.forEach((key, index) => {
      if (lockOwners[index] === userId) {
        pipeline.del(key);
      }
    });

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error(`Error unlocking seats for event ${eventId}:`, {
      userId,
      seatsCount: seats?.length || 0,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};


export const unlockTickets = async (eventId, ticketInfo, userId) => {
  try {
    const { ticketType, count } = ticketInfo;
    
    // Use the same Redis key pattern as in booking middleware
    const lockKey = `tickets:lock:${eventId}:${ticketType}:${userId}`;
    const tempLockKey = `tickets:tempLock:${eventId}:${ticketType}`;
    
    // Check if the lock exists and belongs to the user
    const lockedCount = await redis.get(lockKey);
    if (!lockedCount || parseInt(lockedCount) !== count) {
      console.warn(`Ticket lock mismatch for user ${userId}, event ${eventId}, type ${ticketType}`);
      return false;
    }

    // Use pipeline for atomic operations
    const pipeline = redis.multi();
    pipeline.decrby(tempLockKey, count);
    pipeline.del(lockKey);
    
    const results = await pipeline.exec();
    
    // Check if all operations succeeded
    const allSucceeded = results.every(([err]) => !err);
    
    if (allSucceeded) {
      console.log(`Successfully unlocked ${count} tickets of type ${ticketType} for event ${eventId}`);
      return true;
    } else {
      console.error(`Failed to unlock tickets:`, { eventId, ticketType, userId, results });
      return false;
    }
  } catch (error) {
    console.error(`Error unlocking tickets for event ${eventId}:`, {
      ticketType: ticketInfo?.ticketType,
      userId,
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};
