import { db } from "../config/db.js";
import { events } from "../drizzle/eventSchema.js";
import { zones } from "../drizzle/zoneSchema.js";
import { ticketCategories, ticketPrices } from "../drizzle/ticketPrices.js";
import { eventCleanupQueue } from "../queues/eventCleanupQueue.js";
import { v4 as uuidv4 } from 'uuid';


export const openEvent = async (req, res) => {
    try { 

        const {
            eventName, organiserID, type, subtype, description, location, city, state, area_name,
            start, end, maxParticipantAllowed, platformForOnlineEvent, requiresRegistration, isPaid,
            eventLink, bookingCutoffType, bookingCutoffMinutesBeforeStart, bookingCutoffTimestamp, pricingOption, categorizedPrices, flatPrice,
            eligibility_age, genre, eventInstructions, language, ratingCode, ticketsCancellable
        } = req.body;

        // Validate start and end times
        const scheduleStart = new Date(start);
        const scheduleEnd = new Date(end);
        if (isNaN(scheduleStart.getTime()) || isNaN(scheduleEnd.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid start or end datetime format" });
        }

        // Handle booking cutoff logic
        let bookingCloseTime = null;
        let parsedBookingCutoffTimestamp = null;

        if (bookingCutoffType === 'before_start') {
            if (!bookingCutoffMinutesBeforeStart) {
                return res.status(400).json({ error: 'bookingCutoffMinutesBeforeStart is required' });
            }
            bookingCloseTime = new Date(scheduleStart.getTime() - bookingCutoffMinutesBeforeStart * 60000);
        }

        if (bookingCutoffType === 'custom_time') {
            if (!bookingCutoffTimestamp) {
                return res.status(400).json({ error: 'bookingCutoffTimestamp is required' });
            }

            parsedBookingCutoffTimestamp = new Date(bookingCutoffTimestamp);
            if (isNaN(parsedBookingCutoffTimestamp.getTime())) {
                return res.status(400).json({ error: 'Invalid bookingCutoffTimestamp format' });
            }

            bookingCloseTime = parsedBookingCutoffTimestamp;
        }

        // Create event id
        const eventID = uuidv4();

        console.log("Booking Cut Off Custom Time : ",parsedBookingCutoffTimestamp);

        // create event, insert into database
        await db.insert(events)
            .values({
                id: eventID,
                name: eventName,
                organiserID,
                type,
                sub_type: subtype,
                description,
                eventInstructions,
                location,
                city,
                state,
                area_name,
                scheduleStart,
                scheduleEnd,
                maxParticipantAllowed,
                platformForOnlineEvent,
                requiresRegistration,
                isPaid,
                eventLink,
                bookingCutoffType,
                bookingCutoffMinutesBeforeStart,
                bookingCutoffTimestamp: parsedBookingCutoffTimestamp,
                bookingCloseTime,
                eligibility_age: typeof eligibility_age === 'number' ? eligibility_age : 0,
                genre,
                language,
                ratingCode,
                isTicketsCancelleable: ticketsCancellable,
            })

        // Insert into ticket categories

        if(pricingOption === "categorized") {
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

        return res.status(201).json({
            success: true,
            message: `${eventName} created successfully, starts at ${scheduleStart.toISOString()}`,
            eventID
        })

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}



export const zonesController = async (req, res) => {
    try {

        const { name_capacity, eventID } = req.body;

        if (!name_capacity || typeof name_capacity !== 'object' || Object.keys(name_capacity).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Zone name-capacity map is invalid or empty"
            });
        }

        if (!eventID) {
            return res.status(404).json({
                success: false,
                message: "EventID not found"
            })
        }

        for (let key in name_capacity) {
            await db.insert(zones).values({
                name: key,
                capacity: name_capacity[key],
                eventId: eventID
            })
        }

        return res.status(201).json({
            success: true,
            message: `Zones created for event ID : ${eventID}`
        })

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}