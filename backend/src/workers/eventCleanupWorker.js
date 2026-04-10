import { Worker } from 'bullmq';
import { redis } from '../config/redisClient.js';
import { db } from '../config/db.js';
import { events } from '../drizzle/eventSchema.js';
import { screenTable } from '../drizzle/screenSchema.js';
import { seats } from '../drizzle/seatSchema.js';
import { tickets } from '../drizzle/ticketSchema.js';
import { users } from '../drizzle/userSchema.js';
import { payouts } from '../drizzle/payoutSchema.js';
import { eq, sum } from 'drizzle-orm';

const eventCleanupWorker = new Worker('eventCleanup', async (job) => {
    try {
        const { eventId, eventType } = job.data;

        console.log("Hey i am here to clean...")
        
        if (eventType === 'Seating') {
            // Get event details for screen info
            const event = await db.select().from(events).where(eq(events.id, eventId));
            if (event.length === 0) {
                console.log(`Event ${eventId} not found`);
                return;
            }

            const { screenID } = event[0];
            
            // Update screen table
            await db.update(screenTable)
                .set({
                    isEmpty: true,
                    bookedFrom: null,
                    bookedTill: null,
                    status: 'available'
                })
                .where(eq(screenTable.id, screenID));
        }

        // Get event details for organizer ID
        const event = await db.select().from(events).where(eq(events.id, eventId));
        if (event.length === 0) {
            console.log(`Event ${eventId} not found`);
            return;
        }

        // Update event -> isCompleted: true
        await db.update(events)
            .set({ isCompleted: true })
            .where(eq(events.id, eventId));

        const { organiserID } = event[0];

        // Get ticket aggregations
        const ticketAggregations = await db
            .select({
                totalRevenue: sum(tickets.totalAmount),
                deductions: sum(tickets.totalConvenienceFee),
                netPayable: sum(tickets.baseAmount)
            })
            .from(tickets)
            .where(eq(tickets.eventId, eventId));

        // Get all ticket details with user info
        const allTicketsDetails = await db
            .select({
                ticketId: tickets.id,
                userName: users.name,
                userEmail: users.email,
                seatNo: tickets.seat_no,
                seatType: tickets.seat_type,
                totalAmount: tickets.totalAmount,
                numberOfTicket: tickets.numberOfTickets,
                baseAmount: tickets.baseAmount,
                status: tickets.status,
                convenienceFee: tickets.totalConvenienceFee, 
                createdAt: tickets.createdAt,
                zone: tickets.zone
            })
            .from(tickets)
            .innerJoin(users, eq(tickets.userId, users.id))
            .where(eq(tickets.eventId, eventId));

        // Create payout record
        await db.insert(payouts).values({
            eventId,
            organizerId: organiserID,
            totalRevenue: ticketAggregations[0]?.totalRevenue || '0.00',
            deductions: ticketAggregations[0]?.deductions || '0.00',
            netPayable: ticketAggregations[0]?.netPayable || '0.00',
            allTicketsDetails
        });

        // Mark event as completed
        await db.update(events)
            .set({ isCompleted: true })
            .where(eq(events.id, eventId));

        console.log(`Event ${eventId} cleanup completed with payout record created`);
    } catch (error) {
        console.error(`Error in event cleanup for ${job.data.eventId}:`, error);
        throw error;
    }
}, {
    connection: redis
});

export default eventCleanupWorker;