import { seats } from '../drizzle/seatSchema.js';
import { db } from '../config/db.js';
import { inArray, eq, sql } from 'drizzle-orm';
import { redis } from '../config/redisClient.js';
import { unlockJobQueue } from '../queues/unlockJobQueue.js';
import { tickets } from '../drizzle/ticketSchema.js';
import { refunds } from '../drizzle/refundSchema.js';
import { users } from '../drizzle/userSchema.js';
import { events } from '../drizzle/eventSchema.js';
import { organiser } from '../drizzle/organiserSchema.js';
import { ticketPrices, ticketCategories } from '../drizzle/ticketPrices.js';

// Helper function to calculate convenience fee based on ticket price
const calculateConvenienceFee = (price) => {
    if (price > 0 && price <= 200) return 15;
    if (price > 200 && price <= 500) return 25;
    if (price > 500 && price <= 1000) return 40;
    if (price > 1000) return 60;
    return 0;
};

export const getBookingSummary = async (req, res) => {
    try {
        console.log("=== getBookingSummary START ===");
        const { price, event, categories, type } = req.priceInfo || {};
        const { selectedSeats, eventDetails, categoriesBody } = req.body;

        console.log("Input priceInfo type:", type);
        console.log("Input selectedSeats:", selectedSeats);
        console.log("Input categoriesBody:", categoriesBody);
        console.log("Event details type:", eventDetails?.type);

        // 1. Handle unpaid events
        if (type === "unpaid") {
            console.log("Event is unpaid. Returning 0 amounts.");
            return res.json({
                seats: [],
                totalSeatAmount: 0,
                totalConvenienceFee: 0,
                gstAmount: 0,
                totalAmount: 0,
            });
        }

        // 2. Handle Open/Online events (paid)
        if (eventDetails && (eventDetails.type === "Open" || eventDetails.type === "Online")) {
            console.log("Processing Open/Online event booking summary");
            if (!Array.isArray(categoriesBody) || categoriesBody.length === 0) {
                console.error("No ticket categories provided in body:", categoriesBody);
                return res.status(400).json({ error: "No ticket categories provided" });
            }
            let totalSeatAmount = 0;
            let totalConvenienceFee = 0;
            let seatsInfo = [];
            categoriesBody.forEach(cat => {
                const count = parseInt(cat.count, 10) || 0;
                const priceMatch = parseFloat(cat.price || 0);
                const subtotal = count * priceMatch;
                const convenienceFee = calculateConvenienceFee(priceMatch) * count;
                totalSeatAmount += subtotal;
                totalConvenienceFee += convenienceFee;
                seatsInfo.push({
                    id: cat.id,
                    category: cat.type,
                    price: priceMatch,
                    count: count,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    convenienceFee: convenienceFee,
                });
            });
            // const gstAmount = parseFloat((totalConvenienceFee * 0.18).toFixed(2));
            const gstAmount = 0; // GST temporarily disabled
            const totalAmount = parseFloat((totalSeatAmount + totalConvenienceFee + gstAmount).toFixed(2));
            
            console.log("Calculated Summary for Open/Online:", { totalSeatAmount, totalConvenienceFee, totalAmount });
            return res.json({
                seats: seatsInfo,
                totalSeatAmount: parseFloat(totalSeatAmount.toFixed(2)),
                totalConvenienceFee: parseFloat(totalConvenienceFee.toFixed(2)),
                gstAmount: gstAmount,
                totalAmount: totalAmount,
            });
        }

        // 3. Seating event logic (existing)
        console.log("Processing Seating event booking summary");
        if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            console.error("No seats selected in body:", selectedSeats);
            return res.status(400).json({ error: "No seats selected" });
        }
        // Fetch seat details from the database
        const seatsData = await db
            .select()
            .from(seats)
            .where(inArray(seats.id, selectedSeats));
            
        console.log("Seats fetched from DB count:", seatsData?.length);
        if (!seatsData || seatsData.length === 0) {
            console.error("No valid seats found for IDs:", selectedSeats);
            return res.status(404).json({ error: "No valid seats found" });
        }
        
        let totalSeatAmount = 0;
        let totalConvenienceFee = 0;
        let seatsInfo = [];
        
        console.log("Pricing mode:", type);
        if (type === "flat") {
            const flatPrice = parseFloat(price.price || 0);
            seatsInfo = seatsData.map(seat => {
                const convenienceFee = calculateConvenienceFee(flatPrice);
                totalSeatAmount += flatPrice;
                totalConvenienceFee += convenienceFee;
                return {
                    id: seat.id,
                    category: seat.seatType || "Regular",
                    price: parseFloat(flatPrice.toFixed(2)),
                    convenienceFee: convenienceFee,
                    row: seat.row, 
                    col: seat.col,
                    seat_label: seat.seat_label,
                };
            });
        } else if (type === "category" && Array.isArray(categories)) {
            seatsInfo = seatsData.map(seat => {
                const seatCategory = categories.find(
                    cat => cat.type === seat.seatType
                );
                const categoryPrice = seatCategory ? parseFloat(seatCategory.price || 0) : 0;
                const convenienceFee = calculateConvenienceFee(categoryPrice);
                totalSeatAmount += categoryPrice;
                totalConvenienceFee += convenienceFee;
                return {
                    id: seat.id,
                    category: seat.seatType || "Regular",
                    price: parseFloat(categoryPrice.toFixed(2)),
                    convenienceFee: convenienceFee,
                    row: seat.row,
                    col: seat.col,
                    seat_label: seat.seat_label,
                };
            });
        } else {
            seatsInfo = seatsData.map(seat => {
                const seatPrice = parseFloat(seat.price || 0);
                const convenienceFee = calculateConvenienceFee(seatPrice);
                totalSeatAmount += seatPrice;
                totalConvenienceFee += convenienceFee;
                return {
                    id: seat.id,
                    category: seat.seatType || "Regular",
                    price: parseFloat(seatPrice.toFixed(2)),
                    convenienceFee: convenienceFee,
                    row: seat.row,
                    col: seat.col,
                    seat_label: seat.seat_label,
                };
            });
        }
        // const gstAmount = parseFloat((totalConvenienceFee * 0.18).toFixed(2));
        const gstAmount = 0; // GST temporarily disabled
        const totalAmount = parseFloat((totalSeatAmount + totalConvenienceFee + gstAmount).toFixed(2));
        
        console.log("Calculated Summary for Seating:", { totalSeatAmount, totalConvenienceFee, totalAmount });
        return res.json({
            seats: seatsInfo,
            totalSeatAmount: parseFloat(totalSeatAmount.toFixed(2)),
            totalConvenienceFee: parseFloat(totalConvenienceFee.toFixed(2)),
            gstAmount: gstAmount,
            totalAmount: totalAmount,
        });
    } catch (error) {
        console.error("=== Error in getBookingSummary ===");
        console.error(error.message);
        console.error(error.stack);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// MANUAL UNLOCK ------------------>
export const unlockItems = async (req, res) => { 
    const { eventId, userId, eventType } = req.body;
    console.log("event id : ", eventId);
    console.log("user id : ", userId);
    console.log("event type : ", eventType);

    if (!eventId || !userId || !eventType) {
        return res.status(400).json({ message: "Invalid unlock data" });
    }

    try {
        switch (eventType) {
            case "Seating":
                try {
                    await unlockSeats(eventId, userId);
                } catch (seatError) {
                    console.error(`Failed to unlock seats for event ${eventId}:`, seatError.message);
                    return res.status(500).json({ message: "Failed to unlock seats" });
                }
                break;
            case "Registration":
            case "Open":
            case "Online":
                try {
                    await unlockTickets(eventId, userId);
                } catch (ticketError) {
                    console.error(`Failed to unlock tickets for event ${eventId}:`, ticketError.message);
                    return res.status(500).json({ message: "Failed to unlock tickets" });
                }
                break;
            default:
                return res.status(400).json({ 
                    message: `Unsupported event type: ${eventType}. Supported types: Seating, Registration, Open, Online` 
                });
        }

        return res.status(200).json({ message: "Items unlocked successfully" });
    } catch (error) {
        console.error(`Error unlocking items for event ${eventId}:`, {
            userId,
            eventType,
            error: error.message
        });
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const unlockSeats = async (eventId, userId) => {
    try {
        const keys = await redis.keys(`locked:seat:${eventId}:*`);

        if (keys.length === 0) {
            console.log(`No locked seats found for event ${eventId} and user ${userId}`);
            return;
        }

        const pipeline = redis.multi();
        const seatsToUnlock = [];

        const values = await redis.mget(keys);

        keys.forEach((key, index) => {
            if (values[index] === userId) {
                const seat = key.split(":")[3]; // Extract seat
                pipeline.del(key);
                seatsToUnlock.push(seat);
            }
        });

        if (seatsToUnlock.length > 0) {
            const [redisResult, bullmqResults] = await Promise.allSettled([
                pipeline.exec(),
                Promise.allSettled(seatsToUnlock.map(async (seat) => {
                    const jobId = `unlock-seat-${eventId}-${seat}`;
                    const job = await unlockJobQueue.getJob(jobId);
                    console.log(`Removing job ${jobId} from queue`);
                    console.log(`Job found: ${!!job}`);
                    if (job) {
                        await job.remove();
                        console.log(`Removed job ${jobId} from queue, YEsssssss`);
                        return true;
                    }
                    return false;
                }))
            ]);

            if (redisResult.status === 'rejected') {
                throw new Error(`Redis operation failed: ${redisResult.reason}`);
            }

            console.log(`Unlocked ${seatsToUnlock.length} seats for user ${userId}`);
        }
    } catch (error) {
        console.error(`Error unlocking seats for event ${eventId}:`, {
            userId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

export const unlockTickets = async (eventId, userId) => {
    try {
        const userKeys = await redis.keys(`tickets:lock:${eventId}:*:${userId}`);
        
        if (userKeys.length === 0) {
            console.log(`No locked tickets found for event ${eventId} and user ${userId}`);
            return;
        }

        const pipeline = redis.multi();
        const jobRemovalPromises = [];
        
        // Get all counts first
        const counts = await redis.mget(userKeys);
        
        userKeys.forEach((key, index) => {
            const parts = key.split(":");
            const type = parts[3];
            const tempLockKey = `tickets:tempLock:${eventId}:${type}`;
            const count = parseInt(counts[index]) || 0;

            if (count > 0) {
                pipeline.decrby(tempLockKey, count);
                pipeline.del(key);
                
                // Prepare job removal
                const jobId = `unlock-ticket-${eventId}-${type}-${userId}`;
                jobRemovalPromises.push(
                    unlockJobQueue.remove(jobId).catch(err => {
                        console.warn(`Failed to remove job ${jobId}:`, err.message);
                    })
                );
            }
        });
        
        if (pipeline.length > 0) {
            const [redisResult, jobResults] = await Promise.allSettled([
                pipeline.exec(),
                Promise.allSettled(jobRemovalPromises)
            ]);
            
            if (redisResult.status === 'rejected') {
                throw new Error(`Redis operation failed: ${redisResult.reason}`);
            }
            
            console.log(`Unlocked ${userKeys.length} ticket types for user ${userId}`);
        }
    } catch (error) {
        console.error(`Error unlocking tickets for event ${eventId}:`, {
            userId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};


export const getLockedSeats = async (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ message: "Invalid event ID" });
    }

    try {
        const keys = await redis.keys(`locked:seat:${eventId}:*`);
        
        if (keys.length === 0) {
            return res.status(200).json({ lockedSeats: [] });
        }
        
        // Use mget for better performance instead of individual gets
        const values = await redis.mget(keys);
        const lockedSeats = [];

        keys.forEach((key, index) => {
            if (values[index]) { // Only include if value exists
                const parts = key.split(":");
                const seatId = parts[parts.length - 1];
                lockedSeats.push({ 
                    seatId, 
                    userId: values[index],
                    eventId 
                });
            }
        });

        return res.status(200).json({ 
            lockedSeats,
            count: lockedSeats.length 
        });
    } catch (error) {
        console.error(`Error fetching locked seats for event ${eventId}:`, {
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({ message: "Internal server error" });
    }
};
