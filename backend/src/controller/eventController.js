import cloudinary from "../config/cloudinary.js";
import { db } from "../config/db.js";
import { and, eq } from "drizzle-orm";
import { halls } from "../drizzle/hallSchema.js";
import { screenTable } from "../drizzle/screenSchema.js";
import { events } from "../drizzle/eventSchema.js";
import { likes } from "../drizzle/likesSchema.js";
import streamifier from "streamifier";
import { ticketPrices, ticketCategories } from '../drizzle/ticketPrices.js';
const { organiser } = await import('../drizzle/organiserSchema.js');
import mongoose from "mongoose";
import Form from "../models/FormSchema.js"; // Adjust path as needed


export const uploadPoster = (req, res) => {
    console.log("Uploading poster to Cloudinary");
    console.log("Req file : ", req.file);

    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
        { folder: "posters" }, // optional folder in Cloudinary
        (error, result) => {
            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            return res.status(200).json({
                success: true,
                message: "Uploaded!",
                data: result,
            });
        }
    );
 
    streamifier.createReadStream(req.file.buffer).pipe(stream);
};


export const availableHalls = async (req, res) => {
    try {
        let query = db.select().from(halls).where(eq(halls.status, "active"));

        const hallsData = await query;
        res.status(200).json({
            success: true,
            message: "Available halls fetched successfully",
            data: {
                hallsData,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching available halls",
            error: error.message
        });
    }
}


export const availableScreens = async (req, res) => {
    try {
        const hallID = req.params.hallID;

        if (!hallID) {
            return res.status(400).json({
                success: false,
                message: "Hall ID is required"
            });
        }

        // Validate hall    
        const hallExists = await db.select().from(halls).where(eq(halls.id, hallID));
        if (hallExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hall not found"
            });
        }

        // Fetch screens for the specified hall
        const screens = await db.select().from(screenTable).where(and(eq(screenTable.hallId, hallID), eq(screenTable.status, "available")));
        if (screens.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No screens available for this hall"
            });
        }

        // Return the list of available screens
        return res.status(200).json({
            success: true,
            message: "Available screens fetched successfully",
            data: {
                screens
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error fetching available screens",
            error: err.message
        });
    }
}


export const verifyEvent = async (req, res) => {
    try {
        const { eventID, verificationStatus } = req.body;

        if (!eventID || !verificationStatus) {
            return res.status(400).json({
                success: false,
                message: "Event ID and verification status are required"
            });
        }

        const event = await db.select().from(events).where(eq(events.id, eventID));

        if (event.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const updatedEvent = await db.update(events).set({
            verificationStatus: verificationStatus
        }).where(eq(events.id, eventID));

        return res.status(200).json({
            success: true,
            message: "Event verified successfully",
            data: {
                updatedEvent
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying event",
            error: error.message
        });
    }
}

export const updateEventPosterUrl = async (req, res) => {
    try {
        console.log("Updating event poster URL");
        const { eventId, posterUrl } = req.body;
        if (!eventId || !posterUrl) {
            return res.status(400).json({ success: false, message: "eventId and posterUrl are required" });
        }
        console.log("Updating event poster URL", eventId, posterUrl);
        const updated = await db.update(events)
            .set({ posterUrl })
            .where(eq(events.id, eventId));
        console.log("Event poster URL updated", updated);
        return res.status(200).json({ success: true, message: "Poster URL updated", updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


export const getEventDetails = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { userId } = req.query;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Event ID is required" });
        }

        const eventDetails = await db.select().from(events).where(eq(events.id, eventId));

        if (eventDetails.length === 0) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        const event = eventDetails[0];
        let hall = null;
        let screen = null;
        let isLiked = false;

        if (event.type === 'Seating' && event.hallID && event.screenID) {
            // Fetch hall info
            const hallData = await db.select().from(halls).where(eq(halls.id, event.hallID));
            if (hallData && hallData[0]) {
                hall = hallData[0];
            }
            // Fetch screen info
            const screenData = await db.select().from(screenTable).where(eq(screenTable.id, event.screenID));
            if (screenData && screenData[0]) {
                screen = screenData[0];
            }
        }

        // Check if user has liked this event (only if userId is provided)
        if (userId) {
            const likeData = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.eventId, eventId)));
            isLiked = likeData.length > 0;
        }

        const organiserData = await db.select().from(organiser).where(eq(organiser.id, event.organiserID));
        const organiserName = (organiserData && organiserData[0]) ? organiserData[0].name : "Unknown Organiser";

        return res.status(200).json({
            success: true,
            message: "Event details fetched successfully",
            data: { ...event, hall, screen, isLiked, organiserName }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const getOrganiserEvents = async (req, res) => {
    try {
        const organiserId = req.params.organiserId;

        if (!organiserId) {
            return res.status(400).json({
                success: false,
                message: "Organiser ID is required"
            });
        }

        // Fetch events for the specified organiser
        const organiserEvents = await db.select().from(events).where(eq(events.organiserID, organiserId));

        // Enrich seating events with hall city, state, areaName
        const enrichedEvents = await Promise.all(organiserEvents.map(async (event) => {
            if (event.type === 'Seating' && event.hallID) {
                const hallData = await db.select().from(halls).where(eq(halls.id, event.hallID));
                if (hallData && hallData[0]) {
                    return {
                        ...event,
                        city: hallData[0].city || null,
                        state: hallData[0].state || null,
                        areaName: hallData[0].areaName || null
                    };
                }
            }
            return event;
        }));

        if (enrichedEvents.length === 0) {
            return res.status(201).json({
                success: false,
                organiserEvents: enrichedEvents,
                message: "No events found for this organiser"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Organiser events fetched successfully",
            organiserEvents: enrichedEvents
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching organiser events",
            error: error.message
        });
    }
}

export const updateEventDetails = async (req, res) => {
    try {
        const { eventId, details } = req.body;
        if (!eventId || !details || typeof details !== 'object') {
            return res.status(400).json({ success: false, message: "eventId and details object are required" });
        }
        // List of fields to exclude from update
        const excludeFields = [
            'id', 'createdAt', 'updatedAt', 'hallID', 'screenID', 'verificationStatus', 'isPaid', 'posterUrl',
        ];
        // Remove excluded fields from details
        const updateFields = Object.keys(details)
            .filter(key => !excludeFields.includes(key))
            .reduce((obj, key) => { obj[key] = details[key]; return obj; }, {});
        // Convert date fields to Date objects if needed
        const dateFields = ['scheduleStart', 'scheduleEnd', 'bookingCutoffTimestamp', 'bookingCloseTime', 'createdAt', 'updatedAt'];
        for (const key of dateFields) {
            if (updateFields[key] && typeof updateFields[key] === 'string' && !isNaN(Date.parse(updateFields[key]))) {
                updateFields[key] = new Date(updateFields[key]);
            }
        }
        // Convert empty string integer fields to null
        const intFields = ['bookingCutoffMinutesBeforeStart', 'maxParticipantAllowed', 'eligibility_age', 'ticketsAvailable', 'totalReviews', 'totalBookings'];
        for (const key of intFields) {
            if (updateFields[key] === '') {
                updateFields[key] = null;
            }
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update" });
        }
        const updated = await db.update(events)
            .set(updateFields)
            .where(eq(events.id, eventId));
        return res.status(200).json({ success: true, message: "Event details updated", updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Fetch ticket details for an event
export const getEventTicketDetails = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' });
        const price = await db.select().from(ticketPrices).where(eq(ticketPrices.eventId, eventId));
        const categories = await db.select().from(ticketCategories).where(eq(ticketCategories.eventId, eventId));
        return res.status(200).json({ success: true, data: { price: price[0] || null, categories } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update ticket details for an event
export const updateEventTicketDetails = async (req, res) => {
    try {
        const { eventId, pricingOption, flatPrice, categorizedPrices } = req.body;
        if (!eventId || !pricingOption) return res.status(400).json({ success: false, message: 'eventId and pricingOption are required' });
        // Update ticketPrices
        let updateObj = { pricingOption };
        if (pricingOption === 'flat') {
            updateObj.flatPrice = flatPrice || '0.00';
        }
        await db.update(ticketPrices).set(updateObj).where(eq(ticketPrices.eventId, eventId));
        // Update categories if categorized
        if (pricingOption === 'categorized') {
            // Remove old categories
            await db.delete(ticketCategories).where(eq(ticketCategories.eventId, eventId));
            // Insert new categories
            if (Array.isArray(categorizedPrices)) {
                for (const cat of categorizedPrices) {
                    await db.insert(ticketCategories).values({
                        eventId,
                        type: cat.type,
                        price: cat.price,
                        numberOfTickets: cat.numberOfTickets || 0,
                    });
                }
            }
        }
        return res.status(200).json({ success: true, message: 'Ticket details updated' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};



export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' });
        // Fetch event to determine type
        const event = await db.select().from(events).where(eq(events.id, eventId));
        if (!event.length) return res.status(404).json({ success: false, message: 'Event not found' });
        const eventData = event[0];

        if (eventData.type === 'Seating') {
            // Seating event: use dismissEvent logic
            // Find screenID
            const screenID = eventData.screenID;
            // Delete event
            await db.delete(events).where(eq(events.id, eventId));
            // Clear the screen's booking properties
            if (screenID) {
                await db.update(screenTable)
                    .set({ bookedFrom: null, bookedTill: null, isEmpty: true, status: 'available' })
                    .where(eq(screenTable.id, screenID));
            }
        } else if (eventData.type === 'Registration') {
            // Registration event: delete the event and also delete the formSchemaID from MongoDB
            await db.delete(events).where(eq(events.id, eventId));
            if (eventData.formSchemaID) {
                try {
                    // If not already a string, convert to string
                    const formId = eventData.formSchemaID.toString();
                    // Remove the form document from MongoDB
                    await Form.deleteOne({ _id: new mongoose.Types.ObjectId(formId) });
                } catch (mongoErr) {
                    // Log but don't fail the whole operation if form deletion fails
                    console.error("Failed to delete formSchema from MongoDB:", mongoErr.message);
                }
            }
        } else {
            // Other event types: just delete the event
            await db.delete(events).where(eq(events.id, eventId));
        }
        return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


export const getAllEvents = async (req, res) => {
    try {
        // Join events with organisers to get organiser name, only send approved events
        const eventsWithOrganiser = await db
            .select({
                ...events,
                organiserName: organiser.name
            })
            .from(events)
            .leftJoin(organiser, eq(events.organiserID, organiser.id))
            .where(and(eq(events.verificationStatus, "approved"), eq(events.isCompleted, "false")));


        // For seating events, fetch city and state from hall
        const enrichedEvents = await Promise.all(eventsWithOrganiser.map(async (event) => {
            if (event.type === 'Seating' && event.hallID) {
                // Fetch hall details
                const hallData = await db.select().from(halls).where(eq(halls.id, event.hallID));
                if (hallData && hallData[0]) {
                    return {
                        ...event,
                        city: hallData[0].city || null,
                        state: hallData[0].state || null
                    };
                }
            }
            // For non-seating or missing hallID, just return as is
            return event;
        }));

        res.status(200).json({
            success: true,
            message: "All approved events fetched successfully",
            data: enrichedEvents
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error fetching events",
            error: err.message
        });
    }
};



export const getPriceDetails = async (req, res) => { 
    try {
        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json({ success: false, message: 'eventId is required' });
        }

        // Get the event details from the events table using eventId
        const eventData = await db.select().from(events).where(eq(events.id, eventId));
        if (!eventData || eventData.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Try to fetch price details from ticketPrices using eventId
        const ticketPriceData = await db.select().from(ticketPrices).where(eq(ticketPrices.eventId, eventId));
        if (ticketPriceData && ticketPriceData.length > 0) { 
            return res.status(200).json({
                success: true,
                result: {
                    price: ticketPriceData[0],
                    event: eventData[0]
                }
            });
        }

        // If not found in ticketPrices, try ticketCategories using eventId
        const ticketCategoryData = await db.select().from(ticketCategories).where(eq(ticketCategories.eventId, eventId));
        if (ticketCategoryData && ticketCategoryData.length > 0) {
            return res.status(200).json({
                success: true,
                result: {
                    price: ticketCategoryData,
                    event: eventData[0]
                }
            });
        }

        // If neither found, return not found
        return res.status(404).json({
            success: false,
            message: 'No price details found for this event'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}


export const getRegistrationFields = async (req, res) => {
    try {
        const { eventId } = req.body;
        if (!eventId) {
            return res.status(400).json({ success: false, message: "eventId is required" });
        }

        // Get the event from SQL DB to find the formSchemaID
        const eventData = await db.select().from(events).where(eq(events.id, eventId));
        if (!eventData || eventData.length === 0) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        const minParticipant = eventData[0].minTeamMembers;
        const maxParticipant = eventData[0].maxTeamMembers;

        const formSchemaID = eventData[0].formSchemaID || eventData[0].form_schema_id;
        if (!formSchemaID) {
            return res.status(404).json({ success: false, message: "No formSchemaID found for this event" });
        }

        // Find the form in MongoDB using Form model
        const formDoc = await Form.findById(formSchemaID).lean();
        if (!formDoc) {
            return res.status(404).json({ success: false, message: "Form schema not found" });
        }

        return res.status(200).json({
            success: true,
            fields: formDoc.fields,
            teamRegistration: formDoc.teamRegistration,
            minParticipant,
            maxParticipant
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}


export const getBookedSeats = async (req, res) => {
    const { eventId } = req.params;

    try {
        if(!eventId) return res.status(400).json({ success: false, message: "eventId is required" });

        const confirmedTickets = await db.select({ seatNumbers: tickets.seatNumbers })
            .from(tickets)
            .where(and(eq(tickets.eventId, eventId), eq(tickets.status, 'CONFIRMED')));

        const bookedSeatIds = confirmedTickets
            .filter(ticket => ticket.seatNumbers)
            .flatMap(ticket => ticket.seatNumbers);

        return res.status(200).json({
            success: true,
            message: "Booked seats fetched successfully",
            bookedSeatIds
        });

    } catch(err) {
        console.log("Error in getBookedSeats : ", err);
        return res.status(500).json({ success: false, message: err.message });
    }
}


export const getEventsWithType = async (req, res) => {
    try {
        const { subtype } = req.params;
        if (!subtype) {
            return res.status(400).json({ success: false, message: "Event type is required" });
        }

        const eventsWithOrganiser = await db
            .select({
                ...events,
                organiserName: organiser.name
            })
            .from(events)
            .leftJoin(organiser, eq(events.organiserID, organiser.id))
            .where(and(eq(events.verificationStatus, "approved"), eq(events.isCompleted, "false"), eq(events.sub_type, subtype)));


        // For seating events, fetch city and state from hall
        const enrichedEvents = await Promise.all(eventsWithOrganiser.map(async (event) => {
            if (event.type === 'Seating' && event.hallID) {
                // Fetch hall details
                const hallData = await db.select().from(halls).where(eq(halls.id, event.hallID));
                if (hallData && hallData[0]) {
                    return {
                        ...event, 
                        city: hallData[0].city || null,
                        state: hallData[0].state || null
                    };
                }
            }
            // For non-seating or missing hallID, just return as is
            return event;
        }));

        res.status(200).json({
            success: true,
            message: "All approved events fetched successfully",
            data: enrichedEvents
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error fetching events",
            error: err.message
        });
    }
};