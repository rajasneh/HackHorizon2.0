import { Worker } from "bullmq";
import { redis } from "../config/redisClient.js";
import { unlockSeats, unlockTickets } from "../utils/unlockHelpers.js"; 
import { getIO } from "../app.js";
 
export const unlockWorker = new Worker(
  "unlockJob",
  async (job) => {
    const { type, eventId, itemId, userId, count } = job.data;

    // Validate required job data
    if (!type) throw new Error('Job data missing required field: type');
    if (!eventId) throw new Error('Job data missing required field: eventId');
    if (!itemId) throw new Error('Job data missing required field: itemId');
    if (!userId) throw new Error('Job data missing required field: userId');

    const io = getIO();

    try {
      switch (type) {
        case "seat": {
          const unlocked = await unlockSeats(eventId, [itemId], userId);

          if (unlocked) {
            io.to(eventId).emit("seats-unlocked", { 
              eventId, 
              seats: [itemId] 
            });
          }

          return { unlocked, type: "seat", itemId };
        }

        case "ticket": {
          const unlocked = await unlockTickets(eventId, { 
            ticketType: itemId, 
            count 
          }, userId);

          if (unlocked) {
            io.to(eventId).emit("tickets-unlocked", { 
              eventId, 
              ticketType: itemId,
              count 
            });
          }

          return { unlocked, type: "ticket", itemId, count };
        }

        default:
          throw new Error(`Unknown job type: ${type}. Valid types: seat, ticket`);
      }
    } catch (error) {
      console.error(`Error processing unlock job:`, {
        jobId: job.id,
        type,
        eventId,
        itemId,
        userId,
        error: error.message
      });
      throw error;
    }
  },
  { connection: redis }
);

unlockWorker.on("completed", (job) => {
  console.log(`✅ Unlock job completed: ${job.id} (${job.name})`);
});

unlockWorker.on("failed", (job, err) => {
  console.error(`❌ Unlock job failed: ${job.id}`, err);
});
