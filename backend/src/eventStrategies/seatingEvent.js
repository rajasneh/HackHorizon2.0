import { and, eq, max } from "drizzle-orm";
import { db } from "../config/db.js";
import { events } from "../drizzle/eventSchema.js"
import { halls } from "../drizzle/hallSchema.js";
import { screenTable } from "../drizzle/screenSchema.js";
import { ticketCategories, ticketPrices } from "../drizzle/ticketPrices.js";
import { eventCleanupQueue } from "../queues/eventCleanupQueue.js";
import { v4 as uuidv4 } from 'uuid';
import { sql } from "drizzle-orm";

export const seatingEvent = async(req, res) => { 
    try{
        const { 
            eventName, organiserID, type, subtype, description, isPaid, eventInstructions, hallID, screenID,
            start, end, location, bookingCutoffType, bookingCutoffMinutesBeforeStart, bookingCutoffTimestamp, pricingOption, categorizedPrices, flatPrice,
            eligibility_age, genre, language, ratingCode, ticketsCancellable
        } = req.body;

        // Validate hall
        const checkHallExist = await db.select().from(halls).where(eq(halls.id, hallID));
        if (checkHallExist.length === 0) {
            console.log("Hall provided does not exist");
            return res.status(404).json({ success: false, message: "Hall provided does not exist" });
        }

        // Validate screen
        const checkScreenID = await db.select().from(screenTable)
            .where(and(eq(screenTable.id, screenID), eq(screenTable.hallId, hallID)));

        const totalSeats = checkScreenID[0].totalSeats;

        if (checkScreenID.length === 0) {
            console.log("Screen provided does not exist");
            return res.status(404).json({ success: false, message: "Screen provided does not exist" });
        }

        // Validate start and end times
        const scheduleStart = new Date(start);
        const scheduleEnd = new Date(end);
        if (isNaN(scheduleStart.getTime()) || isNaN(scheduleEnd.getTime())) {
            console.log("Invalid start or end datetime format");
            return res.status(400).json({ success: false, message: "Invalid start or end datetime format" });
        }

        // Check for overlapping events on this screen (with 1 hour buffer after each event)
        const existingEvents = await db.select().from(events)
            .where(
                and(
                    eq(events.screenID, screenID),
                    eq(events.type, 'Seating')
                )
            );
        const scheduleEndWithBuffer = new Date(scheduleEnd.getTime() + 60 * 60 * 1000);
        const hasOverlap = existingEvents.some(ev => {
            const evStart = new Date(ev.scheduleStart);
            const evEndWithBuffer = new Date(new Date(ev.scheduleEnd).getTime() + 60 * 60 * 1000);
            return (scheduleStart < evEndWithBuffer) && (scheduleEndWithBuffer > evStart);
        });
        if (hasOverlap) {
            return res.status(400).json({
                success: false,
                message: "Screen is already booked for the selected time window (including 1 hour buffer after previous events)."
            });
        }

        const checkScreen = checkScreenID[0];
        const totalSeatsInScreen = checkScreen.totalSeats;

        // No global isEmpty/status update here

        // Handle booking cutoff logic
        let bookingCloseTime = null;
        let parsedBookingCutoffTimestamp = null;

        if (bookingCutoffType === 'before_start') {
            if (!bookingCutoffMinutesBeforeStart) {
                console.log("bookingCutoffMinutesBeforeStart is required");
                return res.status(400).json({ error: 'bookingCuto   ffMinutesBeforeStart is required' });
            }
            bookingCloseTime = new Date(scheduleStart.getTime() - bookingCutoffMinutesBeforeStart * 60000);
        }

        if (bookingCutoffType === 'custom_time') {
            if (!bookingCutoffTimestamp) {
                console.log("bookingCutoffTimestamp is required");
                return res.status(400).json({ error: 'bookingCutoffTimestamp is required' });
            }

            parsedBookingCutoffTimestamp = new Date(bookingCutoffTimestamp);
            if (isNaN(parsedBookingCutoffTimestamp.getTime())) {
                console.log("Invalid bookingCutoffTimestamp format");
                return res.status(400).json({ error: 'Invalid bookingCutoffTimestamp format' });
            }

            bookingCloseTime = parsedBookingCutoffTimestamp;
        }

        // Create event id
        const eventID = uuidv4();
            
        // Insert into database
        await db.insert(events).values({
            id: eventID,
            name: eventName,
            organiserID,
            type,
            sub_type: subtype,
            description,
            scheduleStart,
            scheduleEnd,
            location,
            hallID,
            screenID,
            isPublished: true,
            isPaid,
            eventInstructions,
            ticketsAvailable: totalSeatsInScreen,
            maxParticipantAllowed: totalSeats,
            bookingCutoffType,
            bookingCutoffMinutesBeforeStart,
            bookingCutoffTimestamp: parsedBookingCutoffTimestamp,
            bookingCloseTime,
            eligibility_age: typeof eligibility_age === 'number' ? eligibility_age : 0,
            genre,
            language,
            ratingCode,
            isTicketsCancelleable: ticketsCancellable,
        });

        // update the hall's screen booked from and booked till parameter (for reference, not for booking logic)
        await db.update(screenTable)
            .set({
                bookedFrom: scheduleStart,
                bookedTill: scheduleEnd
            })
            .where(and(eq(screenTable.id, screenID)), eq(screenTable.hallId, hallID))
        
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
                numberOfTickets: totalSeatsInScreen, // Use maxParticipantAllowed or totalSeatsInScreen if not provided
            });
        }

        // Schedule cleanup job for event end
        console.log("When to clean, clean timing : ", scheduleEnd.getTime() - Date.now());
        await eventCleanupQueue.add(
            'cleanup-event',
            { eventId: eventID, eventType: type },
            { delay: scheduleEnd.getTime() - Date.now(), jobId: `cleanup-${eventID}` }
        );

        return res.status(201).json({
            success: true,
            message: `${eventName} created successfully, starts at ${scheduleStart.toISOString()}`,
            eventID,
            screenID
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

export const checkSeatingSlot = async (req, res) => {
    try {
        const { hallID, screenID, start, end } = req.body;
        // Validate input
        if (!hallID || !screenID || !start || !end) {
            return res.status(400).json({ success: false, message: "Missing hallID, screenID, start, or end." });
        }
        const scheduleStart = new Date(start);
        const scheduleEnd = new Date(end);
        if (isNaN(scheduleStart.getTime()) || isNaN(scheduleEnd.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid start or end datetime format" });
        }
        // Check for overlapping events on this screen (with 1 hour buffer after each event)
        const existingEvents = await db.select().from(events)
            .where(
                and(
                    eq(events.screenID, screenID),
                    eq(events.type, 'Seating')
                )
            );
        const scheduleEndWithBuffer = new Date(scheduleEnd.getTime() + 60 * 60 * 1000);
        const hasOverlap = existingEvents.some(ev => {
            const evStart = new Date(ev.scheduleStart);
            const evEndWithBuffer = new Date(new Date(ev.scheduleEnd).getTime() + 60 * 60 * 1000);
            return (scheduleStart < evEndWithBuffer) && (scheduleEndWithBuffer > evStart);
        });
        if (hasOverlap) {
            return res.status(200).json({
                success: false,
                message: "Screen is already booked for the selected time window (including 1 hour buffer after previous events)."
            });
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


export const dismissEvent = async(req, res) => {
    try{

        const { eventID, screenID } = req.body;

        const getEvent = await db.select()
            .from(events)
            .where(and(eq(eventID, events.id)), eq(screenID, events.id))

        const getScreen = await db.select()
            .from(screenTable)
            .where(eq(screenID, screenTable.id))

        // Check if the request is valid or not
        if(getScreen.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Screen not found"
            })
        }

        if(getEvent.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Event not found"
            })
        }

        // delete the row with the id of the event
        await db.delete(events)
            .where(and(eq(eventID, events.id)), eq(screenID, events.id))

        
        // clear the screen table's booking properties (booked from and to, isEmpty = true)
        await db.update(screenTable)
            .set({
                bookedFrom: null,
                bookedTill: null,
                isEmpty: true,
                status: "available"
            })
            .where(eq(screenID, screenTable.id))

        
        return res.status(201).json({
            success: true,
            message: `Event ${eventID} dismissed`,
        })


    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}