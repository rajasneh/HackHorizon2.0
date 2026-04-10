import { db } from "../config/db.js";
import { events } from "../drizzle/eventSchema.js";
import { ticketCategories, ticketPrices } from "../drizzle/ticketPrices.js";
import { eventCleanupQueue } from "../queues/eventCleanupQueue.js";
import { v4 as uuidv4 } from 'uuid';

export const onlineEvent = async (req, res) => {
    try {
        const {
            eventName, organiserID, type, subtype, description, isPaid,
            start, end, maxParticipantAllowed, platformForOnlineEvent, requiresRegistration, eventInstructions,
            onlineDetails, bookingCutoffType, bookingCutoffMinutesBeforeStart, bookingCutoffCustomTime, pricingOption, categorizedPrices, flatPrice,
            eligibility_age, genre, language, ratingCode, ticketsCancellable
        } = req.body; 


        let isregRequired = requiresRegistration === "true";
        let isitPaid = isPaid === "true";

        // Event Link
        const { link } = onlineDetails;

        // Validate start and end times
        const scheduleStart = new Date(start);
        const scheduleEnd = new Date(end);
        if (isNaN(scheduleStart.getTime()) || isNaN(scheduleEnd.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid start or end datetime format" });
        }

        // Handle booking cutoff logic
        let bookingCloseTime = null;
        let parsedBookingCutoffCustomTime = null;

        if (bookingCutoffType === 'before_start') {
            if (!bookingCutoffMinutesBeforeStart) {
                return res.status(400).json({ error: 'bookingCutoffMinutesBeforeStart is required' });
            }
            bookingCloseTime = new Date(scheduleStart.getTime() - bookingCutoffMinutesBeforeStart * 60000);
        }

        if (bookingCutoffType === 'custom_time') {
            if (!bookingCutoffCustomTime) {
                return res.status(400).json({ error: 'bookingCutoffCustomTime is required' });
            }

            parsedBookingCutoffCustomTime = new Date(bookingCutoffCustomTime);
            if (isNaN(parsedBookingCutoffCustomTime.getTime())) {
                return res.status(400).json({ error: 'Invalid bookingCutoffTimestamp format' });
            }

            bookingCloseTime = parsedBookingCutoffCustomTime;
        }

        // Create event id
        const eventID = uuidv4();

        await db.insert(events)
            .values({
                id: eventID,
                name: eventName,
                organiserID,
                type,
                sub_type: subtype,
                description,
                isPaid: isitPaid,
                scheduleStart,
                scheduleEnd,
                isOnline: true,
                isPublished: true,
                maxParticipantAllowed,
                platformForOnlineEvent,
                requiresRegistration: isregRequired,
                eventInstructions,
                eventLink: link,
                bookingCutoffType,
                bookingCutoffMinutesBeforeStart,
                bookingCutoffTimestamp: parsedBookingCutoffCustomTime,
                bookingCloseTime,
                eligibility_age: typeof eligibility_age === 'number' ? eligibility_age : 0,
                genre,
                language,
                ratingCode,
                isTicketsCancelleable: ticketsCancellable,
            })

        // Insert into ticket categories
        if (pricingOption === "categorized") {
            await db.insert(ticketCategories).values(categorizedPrices.map(price => ({
                eventId: eventID,
                type: price.type,
                numberOfTickets: price.numberOfTickets,
                price: price.price
            })));
        }

        if(pricingOption === "flat") {
            await db.insert(ticketPrices).values({
                eventId: eventID,
                flatPrice,
                numberOfTickets: maxParticipantAllowed,
            });
        }

        // Schedule cleanup job for event end
        await eventCleanupQueue.add(
            'cleanup-event',
            { eventId: eventID, eventType: type },
            { delay: scheduleEnd.getTime() - Date.now(), jobId: `cleanup-${eventID}` }
        );

        return res.status(200).json({
            success: true,
            message: `${eventName} created successfully, starts at ${scheduleStart.toISOString()}`,
            eventID
        })

    } catch (err) {
        console.log("Error here : ", err);
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}