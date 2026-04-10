import { db } from '../config/db.js';
import { seats } from '../drizzle/seatSchema.js';
import { tickets } from '../drizzle/ticketSchema.js';
import { organiser } from '../drizzle/organiserSchema.js';
import { ticketPrices, ticketCategories } from '../drizzle/ticketPrices.js';
import { events } from '../drizzle/eventSchema.js';
import { users } from '../drizzle/userSchema.js';
import { unlockSeats, unlockTickets } from '../controller/bookingController.js'; 
import { eq, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sendTicketBookedEmail } from '../mail-syntax/ticketBooked.js';

export const completeBooking = async ({ orderId, paymentId, eventId, userId, categories, selectedSeats, eventDetails, totalAmount, totalConvenienceFee }) => {
    try {
        const type = eventDetails.type;
        let totalTicketsBooked = 0;
        let base_amount = 0;
        let convenience_fee = 0;

        if (type === 'Seating') { 
            // Get seat details for seat labels
            const seatDetails = await db.select().from(seats).where(inArray(seats.id, selectedSeats));
            const seatLabels = seatDetails.map(seat => seat.seat_label).join(', ');
            const seatType = seatDetails[0]?.seatType;

            totalTicketsBooked = selectedSeats.length;
            base_amount = totalAmount - totalConvenienceFee;

            // 3. Insert booking details for seating event
            await db.insert(tickets).values({
                id: uuidv4(),
                userId,
                eventId,
                bookingID: orderId,
                paymentId,
                orderId,
                eventType: type,
                posterUrl: eventDetails.poster,
                eventDetails,
                numberOfTickets: totalTicketsBooked,
                qr: uuidv4(),
                totalAmount,
                totalConvenienceFee,
                baseAmount: base_amount,
                status: 'CONFIRMED',
                hall_name: eventDetails.hallName,
                screen_no: eventDetails.screenNo,
                seat_type: seatType || 'Regular',
                seat_no: seatLabels,
                seatNumbers: selectedSeats,
                valid_till: eventDetails.eventEnd ? new Date(eventDetails.eventEnd) : new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            // 4. Unlock seats
            await unlockSeats(eventId, userId);
        }
        else {
            // 2. Update ticket counts in pricing tables
            for (const category of categories) {
                if (category.id.includes('flat')) {
                    // Update ticket_prices table
                    await db.update(ticketPrices)
                        .set({ ticketsSold: sql`tickets_sold + ${category.count}` })
                        .where(eq(ticketPrices.id, category.id));
                } else {
                    // Update ticket_categories table
                    await db.update(ticketCategories)
                        .set({ ticketsSold: sql`tickets_sold + ${category.count}` })
                        .where(eq(ticketCategories.id, category.id));
                }
                totalTicketsBooked += category.count;
            }

            base_amount = totalAmount - totalConvenienceFee;

            // 3. Insert booking details for non-seating event
            await db.insert(tickets).values({
                id: uuidv4(),
                userId,
                eventId,
                bookingID: orderId,
                paymentId,
                posterUrl: eventDetails.poster,
                eventDetails,
                orderId,
                eventType: type,
                numberOfTickets: totalTicketsBooked,
                qr: uuidv4(),
                totalAmount,
                baseAmount: base_amount,
                totalConvenienceFee,
                status: 'CONFIRMED',
                zone: categories[0]?.type,
                valid_till: eventDetails.eventEnd ? new Date(eventDetails.eventEnd) : new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            // 4. Unlock tickets
            await unlockTickets(eventId, userId);

        }

        // Update event's totalBookings count
        await db.update(events)
            .set({ totalBookings: sql`total_bookings + ${totalTicketsBooked}` })
            .where(eq(events.id, eventId));

        // Update organiser's ticket_sold count
        const event = await db.select().from(events).where(eq(events.id, eventId));
        if (event.length > 0) {
            const revenueAmount = totalAmount - totalConvenienceFee;
            await db.update(organiser)
                .set({
                    ticketSold: sql`ticket_sold + ${totalTicketsBooked}`,
                    grossRevenue: sql`gross_revenue + ${revenueAmount}`
                })
                .where(eq(organiser.id, event[0].organiserID));
        }

        // Send booking confirmation email
        try {
            const userData = await db
                .select({ email: users.email, name: users.name })
                .from(users)
                .where(eq(users.id, userId));
            
            if (userData.length > 0) {
                const userEmail = userData[0].email;
                
                // Handle date formatting with fallback
                let eventDate = 'Date TBD';
                let eventTime = 'Time TBD';
                
                if (eventDetails.scheduleStart) {
                    const eventStartDate = new Date(eventDetails.scheduleStart);
                    if (!isNaN(eventStartDate.getTime())) {
                        eventDate = eventStartDate.toLocaleDateString('en-IN');
                        eventTime = eventStartDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    }
                } else if (eventDetails.date) {
                    // Fallback to eventDetails.date if scheduleStart is not available
                    const fallbackDate = new Date(eventDetails.date);
                    if (!isNaN(fallbackDate.getTime())) {
                        eventDate = fallbackDate.toLocaleDateString('en-IN');
                        eventTime = fallbackDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    }
                }
                
                const emailDetails = {
                    orderId,
                    eventName: eventDetails.name || eventDetails.eventName || 'Event',
                    eventDate,
                    eventTime,
                    totalAmount,
                    numberOfTickets: totalTicketsBooked,
                    seatNumbers: type === 'Seating' ? (selectedSeats ? await db.select().from(seats).where(inArray(seats.id, selectedSeats)).then(seats => seats.map(s => s.seat_label).join(', ')) : null) : null,
                    eventType: type
                };
                
                await sendTicketBookedEmail(userEmail, emailDetails); 
            }
        } catch (emailError) {
            console.error('Error sending booking confirmation email:', emailError);
        }

        return { success: true, bookingId: orderId, totalAmount, totalTickets: totalTicketsBooked };

    } catch (error) {
        console.error("Error completing booking:", error);
        throw error;
    }
}