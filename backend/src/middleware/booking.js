import { db } from "../config/db.js";
import { redis } from "../config/redisClient.js";
import { events } from "../drizzle/eventSchema.js";
import { ticketPrices, ticketCategories } from "../drizzle/ticketPrices.js";
import { and, eq, ne, inArray } from "drizzle-orm";
import { unlockJobQueue } from "../queues/unlockJobQueue.js";
import { seats } from '../drizzle/seatSchema.js';


export const getPrices = async (req, res, next) => {
    try {
        const { eventId } = req.body;
        if (!eventId) {
            return res.status(400).json({ success: false, message: 'eventId is required' });
        }

        // Get the event details from the events table using eventId
        const eventData = await db.select().from(events).where(eq(events.id, eventId));
        if (!eventData || eventData.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // if the event is unpaid
        if(!eventData[0].isPaid) {
            req.priceInfo = {
                price: 0,
                event: eventData[0],
                categories: null,
                type: "unpaid"
            };
            return next();
        }

        // Try to fetch price details from ticketPrices using eventId
        const ticketPriceData = await db.select().from(ticketPrices).where(eq(ticketPrices.eventId, eventId));
        if (ticketPriceData && ticketPriceData.length > 0) {
            req.priceInfo = {
                price: {
                    ...ticketPriceData[0],
                    price: ticketPriceData[0].flatPrice // Map flatPrice to price for consistency
                },
                event: eventData[0],
                categories: null,
                type: "flat"
            };
            return next();
        }

        // If not found in ticketPrices, try ticketCategories using eventId
        const ticketCategoryData = await db.select().from(ticketCategories).where(eq(ticketCategories.eventId, eventId));
        console.log('Ticket category data found:', ticketCategoryData?.length || 0, 'categories');
        if (ticketCategoryData && ticketCategoryData.length > 0) {
            req.priceInfo = {
                price: null,
                event: eventData[0], 
                categories: ticketCategoryData, 
                type: "category"
            };
            return next();
        }

        // If neither found, return not found
        return res.status(404).json({
            success: false,
            message: 'No price details found for this event'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


// Helper function to calculate convenience fee based on ticket price
const calculateConvenienceFee = (price) => {
    if (price >= 0 && price <= 199) return 10;
    if (price >= 200 && price <= 499) return 30;
    if (price >= 500 && price <= 999) return 50;
    if (price >= 1000) return 75;
    return 0;
};

export const calculateTicketPrices = async (req, res, next) => {
    try {
        const { price, event, categories, type } = req.priceInfo;
        const { selectedSeats, eventDetails, categoriesBody, item } = req.body;

        // Handle unpaid events
        if (type === "unpaid") {
            req.calculatedPrices = {
                totalSeatAmount: 0,
                totalConvenienceFee: 0,
                gstAmount: 0,
                totalAmount: 0,
                itemDetails: []
            };
            return next();
        }

        // Handle Open/Online events
        if (eventDetails && (eventDetails.type === "Open" || eventDetails.type === "Online")) {
            const ticketData = categoriesBody || item || [];
            if (!Array.isArray(ticketData) || ticketData.length === 0) {
                return res.status(400).json({ error: "No ticket categories provided" });
            }
            
            let totalSeatAmount = 0;
            let totalConvenienceFee = 0;
            let itemDetails = [];
            
            ticketData.forEach(cat => {
                const count = parseInt(cat.count, 10) || 0;
                const ticketPrice = parseFloat(cat.price || 0);
                const subtotal = count * ticketPrice;
                const convenienceFee = calculateConvenienceFee(ticketPrice) * count;
                
                totalSeatAmount += subtotal;
                totalConvenienceFee += convenienceFee;
                
                itemDetails.push({
                    id: cat.id,
                    type: cat.type,
                    price: ticketPrice,
                    count: count,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    convenienceFee: convenienceFee
                });
            });
            
            const gstAmount = 0; // GST temporarily disabled
            const totalAmount = parseFloat((totalSeatAmount + totalConvenienceFee + gstAmount).toFixed(2));
            
            req.calculatedPrices = {
                totalSeatAmount: parseFloat(totalSeatAmount.toFixed(2)),
                totalConvenienceFee: parseFloat(totalConvenienceFee.toFixed(2)),
                gstAmount: gstAmount,
                totalAmount: totalAmount,
                itemDetails: itemDetails
            };
            return next();
        }

        // Handle Seating events
        const seatIds = selectedSeats || item || [];
        if (!Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ error: "No seats selected" });
        }
        
        // Fetch seat details from database
        const seatsData = await db
            .select()
            .from(seats)
            .where(inArray(seats.id, seatIds));
            
        if (!seatsData || seatsData.length === 0) {
            return res.status(404).json({ error: "No valid seats found" });
        }
        
        let totalSeatAmount = 0;
        let totalConvenienceFee = 0;
        let itemDetails = [];
        
        if (type === "flat") {
            const flatPrice = parseFloat(price.price || 0);
            seatsData.forEach(seat => {
                const convenienceFee = calculateConvenienceFee(flatPrice);
                totalSeatAmount += flatPrice;
                totalConvenienceFee += convenienceFee;
                
                itemDetails.push({
                    id: seat.id,
                    seatLabel: seat.seat_label,
                    category: seat.seatType || "Regular",
                    price: parseFloat(flatPrice.toFixed(2)),
                    convenienceFee: convenienceFee,
                    row: seat.row,
                    col: seat.col
                });
            });
        } else if (type === "category" && Array.isArray(categories)) {
            seatsData.forEach(seat => {
                const seatCategory = categories.find(cat => cat.type === seat.seatType);
                const categoryPrice = seatCategory ? parseFloat(seatCategory.price || 0) : 0;
                const convenienceFee = calculateConvenienceFee(categoryPrice);
                
                totalSeatAmount += categoryPrice;
                totalConvenienceFee += convenienceFee;
                
                itemDetails.push({
                    id: seat.id,
                    seatLabel: seat.seat_label,
                    category: seat.seatType || "Regular",
                    price: parseFloat(categoryPrice.toFixed(2)),
                    convenienceFee: convenienceFee,
                    row: seat.row,
                    col: seat.col
                });
            });
        } else {
            seatsData.forEach(seat => {
                const seatPrice = parseFloat(seat.price || 0);
                const convenienceFee = calculateConvenienceFee(seatPrice);
                
                totalSeatAmount += seatPrice;
                totalConvenienceFee += convenienceFee;
                
                itemDetails.push({
                    id: seat.id,
                    seatLabel: seat.seat_label,
                    category: seat.seatType || "Regular",
                    price: parseFloat(seatPrice.toFixed(2)),
                    convenienceFee: convenienceFee,
                    row: seat.row,
                    col: seat.col
                });
            });
        }
        
        const gstAmount = 0; // GST temporarily disabled
        const totalAmount = parseFloat((totalSeatAmount + totalConvenienceFee + gstAmount).toFixed(2));
        
        req.calculatedPrices = {
            totalSeatAmount: parseFloat(totalSeatAmount.toFixed(2)),
            totalConvenienceFee: parseFloat(totalConvenienceFee.toFixed(2)),
            gstAmount: gstAmount,
            totalAmount: totalAmount,
            itemDetails: itemDetails
        };
        
        return next();
    } catch (error) {
        console.error("Error in calculateTicketPrices:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export const lockItems = async (req, res, next) => {
    const { eventId, eventType, item, userId } = req.body;
    const io = req.app.get("io");

    if (req.priceInfo?.type === "unpaid") {
        return next();
    }

    if (!eventId || !eventType || !Array.isArray(item) || !userId) {
        console.log("Invalid request data:", {
            eventId: eventId || 'missing',
            eventType: eventType || 'missing', 
            itemCount: Array.isArray(item) ? item.length : 'not array',
            userId: userId || 'missing'
        });
        return res.status(400).json({ message: "Invalid request data" });
    }

    try {
        switch (eventType) {
            case "Seating": {
                const seatResult = await lockSeats({ eventId, item, userId, io });

                if (!seatResult.success) {
                    return res.status(409).json({
                        message: "Some seats are already locked",
                        failedSeats: seatResult.failedSeats,
                    });
                }

                return next();
            }

            case "Registration":
            case "Open":
            case "Online": {
                const ticketResult = await lockTickets({ eventId, item, userId, io });

                if (!ticketResult.success) {
                    return res.status(409).json({
                        message: "Some tickets couldn't be locked due to limited availability",
                        failedTickets: ticketResult.failedTypes,
                        // amazonq-ignore-next-line
                        locked: ticketResult.locked,
                    });
                }

                return next();
            }

            default:
                console.log("Unsupported event type:", {
                eventType: eventType || 'undefined',
                supportedTypes: ['Seating', 'Registration', 'Open', 'Online']
            });
                return res.status(400).json({ message: "Unsupported event type" });
        }
    } catch (error) {
        console.error("Error locking items:", { message: error.message });
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Lock seats using Redis NX flag and schedule BullMQ unlock job
const lockSeats = async ({ eventId, item: seats, userId, io }) => {
    const failedSeats = [];
    const successfullyLocked = [];

    try {
        for (const seat of seats) {
            const lockKey = `locked:seat:${eventId}:${seat}`;
            
            try {
                const result = await redis.set(lockKey, userId, "NX", "EX", 600);
     
                if (result === null) {
                    failedSeats.push(seat);
                } else {
                    successfullyLocked.push(seat);

                    // Schedule unlock job in BullMQ
                    await unlockJobQueue.add(
                        'unlockSeat', // job name (can be anything, not important here)
                        {
                          type: "seat",
                          eventId,
                          itemId: seat,
                          userId,
                        },
                        {
                          jobId: `unlock-seat-${eventId}-${seat}`, // 👈 this is the fix
                          delay: 600000,
                          attempts: 1,
                          removeOnComplete: true,
                          removeOnFail: true
                        }
                      );
                      
                }
            } catch (seatError) {
                console.error(`Error locking seat ${seat}:`, {
                    eventId,
                    seat,
                    userId,
                    error: seatError.message
                });
                failedSeats.push(seat);
            }
        }

        if (failedSeats.length > 0) {
            return { success: false, failedSeats };
        }
 
        io.to(eventId).emit("seats-locked", { eventId, seats: successfullyLocked });
        return { success: true, seats: successfullyLocked };
    } catch (error) {
        console.error(`Error in lockSeats:`, {
            eventId,
            userId,
            seatsCount: seats.length,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Lock tickets and schedule BullMQ unlock job
const lockTickets = async ({ eventId, item, userId, io }) => {
    const failedTypes = [];
    const successfullyLocked = [];

    try {
        // Fetch all ticket info in one query to optimize performance
        const ticketTypes = item.map(ticket => ticket.type);
        const [categoryResults, priceResults] = await Promise.all([
            db.select()
                .from(ticketCategories)
                .where(and(
                    eq(ticketCategories.eventId, eventId),
                    inArray(ticketCategories.type, ticketTypes)
                )),
            db.select()
                .from(ticketPrices)
                .where(eq(ticketPrices.eventId, eventId))
                .limit(1)
        ]);

        // Create lookup maps for better performance
        const categoryMap = new Map(categoryResults.map(cat => [cat.type, cat]));
        const defaultPrice = priceResults[0];

        // Batch get all tempLock keys for better performance
        const tempLockKeys = item.map(ticket => `tickets:tempLock:${eventId}:${ticket.type}`);
        const tempLockValues = await redis.mget(tempLockKeys);
        
        for (let i = 0; i < item.length; i++) {
            const ticket = item[i];
            const { type, count } = ticket;

            const lockKey = `tickets:lock:${eventId}:${type}:${userId}`;

            let ticketInfo = categoryMap.get(type);
            if (!ticketInfo && type === "default" && defaultPrice) {
                ticketInfo = defaultPrice;
            }

            if (!ticketInfo) {
                failedTypes.push({ type, reason: "Ticket type not found in categories or prices" });
                continue;
            }

            const { numberOfTickets, ticketsSold } = ticketInfo;
            const lockedTemp = parseInt(tempLockValues[i]) || 0;
            const available = numberOfTickets - ticketsSold - lockedTemp;

            if (available < count) {
                failedTypes.push({ type, requested: count, available });
                continue;
            }

            try {
                const tempLockKey = `tickets:tempLock:${eventId}:${type}`;
                const pipeline = redis.multi();
                pipeline.set(lockKey, count, "EX", 600);
                pipeline.incrby(tempLockKey, count);
                pipeline.expire(tempLockKey, 600);
                const results = await pipeline.exec();

                // Check if all Redis operations succeeded
                const allSucceeded = results.every(([err]) => !err);
                if (!allSucceeded) {
                    failedTypes.push({ type, reason: "Redis operation failed" });
                    continue;
                }

                successfullyLocked.push({ type, count });

                // Schedule unlock job in BullMQ
                await unlockJobQueue.add(`unlock-ticket-${eventId}-${type}-${userId}`, {
                    type: "ticket",
                    eventId,
                    itemId: type,
                    count,
                    userId,
                }, {
                    delay: 600000, // 10 minutes
                    attempts: 1,
                });
            } catch (redisError) {
                console.error(`Redis error for ticket ${type}:`, {
                    eventId,
                    type,
                    userId,
                    error: redisError.message
                });
                failedTypes.push({ type, reason: "Redis operation failed" });
            }
        }

        if (failedTypes.length > 0) {
            return {
                success: false,
                failedTypes,
                locked: successfullyLocked,
            };
        }

        io.to(eventId).emit("tickets-locked", { eventId, locked: successfullyLocked });

        return {
            success: true,
            locked: successfullyLocked,
        };
    } catch (error) {
        console.error(`Error in lockTickets:`, {
            eventId,
            userId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};



