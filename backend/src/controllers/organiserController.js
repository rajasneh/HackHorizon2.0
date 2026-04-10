import { organiser } from "../drizzle/organiserSchema.js";
import { events } from "../drizzle/eventSchema.js"
import { tickets } from "../drizzle/ticketSchema.js"
import { users } from "../drizzle/userSchema.js"
import { payouts } from "../drizzle/payoutSchema.js"
import { db } from "../config/db.js"
import { and, eq } from 'drizzle-orm';
import crypto from 'crypto'

export const createOrganiser = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and phone are required.",
            });
        }

        const cleanedEmail = email.trim();
        const cleanedPhone = phone.trim();
        const cleanedName = name.trim();

        const isEmailTaken = await db
            .select()
            .from(organiser)
            .where(eq(organiser.email, cleanedEmail));

        if (Array.isArray(isEmailTaken) && isEmailTaken.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const isPhoneNoTaken = await db
            .select()
            .from(organiser)
            .where(eq(organiser.phone, cleanedPhone));

        if (Array.isArray(isPhoneNoTaken) && isPhoneNoTaken.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Phone Number already exists",
            });
        }

        const insertOrganiser = await db.insert(organiser).values({
            name: cleanedName,
            email: cleanedEmail,
            phone: cleanedPhone,
        });

        return res.status(200).json({
            success: true,
            message: "Organiser created successfully",
        });
    } catch (err) {
        console.error("Error creating organiser:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
};


export const deleteOrganiser = async (req, res) => {
    try {
        const { email, id } = req.body;

        // Validate inputs
        if (!email || !id) {
            return res.status(400).json({
                success: false,
                message: "Email and ID are required.",
            });
        }

        const cleanedEmail = email.trim();

        // Fetch the organiser to ensure existence
        const organiserToDelete = await db
            .select()
            .from(organiser)
            .where( 
                and(eq(organiser.email, cleanedEmail), eq(organiser.id, id))
            );

        if (!Array.isArray(organiserToDelete) || organiserToDelete.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Organiser with this email and ID does not exist",
            });
        }

        // Proceed to delete
        const deleteOrg = await db
            .delete(organiser)
            .where(eq(organiser.id, id));

        console.log("Deleted organiser:", deleteOrg);

        return res.status(200).json({
            success: true,
            message: "Organiser deleted successfully",
        });
    } catch (err) {
        console.error("Delete organiser error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
};


export const checkBankingDetails = async (req, res) => {
    const { orgId } = req.params;

    try{

        if(!orgId) {
            return res.status(404).json({
                success: false,
                message: "Organiser ID not found"
            })
        }

        const orgData = await db.select()
            .from(organiser)
            .where(eq(organiser.id, orgId));

        if(orgData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Organiser does not exist"
            })
        }

        const upiID = orgData[0].upi_id;
        const bankingName = orgData[0].account_holder_name;

        if(upiID && bankingName) {
            return res.status(200).json({
                success: true,
                message: "Banking details found",
                exists: true
            })
        }

        return res.status(200).json({
            success: false,
            message: "Baking details not found",
            exists: false
        })

    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
} 

export const addBankingDetails = async (req, res) => {
    const { orgId, upiID, bankingName } = req.body;

    try {
        if(!orgId || !upiID || !bankingName) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const orgData = await db.select()
            .from(organiser)
            .where(eq(organiser.id, orgId));

        if(orgData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Organiser does not exist"
            })
        }

        const updateOrg = await db.update(organiser)
            .set({
                upi_id: upiID,
                account_holder_name: bankingName
            })
            .where(eq(organiser.id, orgId));

        return res.status(200).json({
            success: true,
            message: "Banking details added successfully"
        })

    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


export const dashboardData = async (req, res) => {
    const { organiserId } = req.body;

    if (!organiserId) {
        return res.status(400).json({
            success: false,
            message: "Organiser ID is required.",
        });
    }

    try {
        const organiserData = await db
            .select()
            .from(organiser)
            .where(eq(organiser.id, organiserId));

        if (!Array.isArray(organiserData) || organiserData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Organiser not found",
            });
        }

        const { ticketSold, grossRevenue } = organiserData[0];

        const eventData = await db
            .select()
            .from(events)
            .where(eq(events.organiserID, organiserId));

        const totalEvents = eventData.length;

        // Get ticket details with user information for all events
        const eventIds = eventData.map(event => event.id);
        let ticketDetails = [];
        
        if (eventIds.length > 0) {
            // For multiple events, we need to fetch tickets with user details for each event
            const allTicketsWithUsers = [];
            for (const eventId of eventIds) {
                const eventTicketsWithUsers = await db
                    .select({
                        // Ticket details
                        ticketId: tickets.id,
                        eventId: tickets.eventId,
                        userId: tickets.userId,
                        numberOfTickets: tickets.numberOfTickets,
                        totalAmount: tickets.totalAmount,
                        status: tickets.status,
                        createdAt: tickets.createdAt, 
                        eventType: tickets.eventType,
                        seatType: tickets.seat_type,
                        seatNumbers: tickets.seat_no,
                        zone: tickets.zone,
                        // User details
                        userName: users.name,
                        userEmail: users.email,
                        userPhone: users.phone
                    })
                    .from(tickets)
                    .leftJoin(users, eq(tickets.userId, users.id))
                    .where(eq(tickets.eventId, eventId));
                allTicketsWithUsers.push(...eventTicketsWithUsers);
            }
            ticketDetails = allTicketsWithUsers;
        } 

        // Get payout data for revenue and pending payments
        const payoutData = await db
            .select({
                eventId: payouts.eventId,
                netPayable: payouts.netPayable,
                status: payouts.status
            })
            .from(payouts)
            .innerJoin(events, eq(payouts.eventId, events.id))
            .where(eq(events.organiserID, organiserId));

        // Calculate pending payments
        const pendingPayments = payoutData
            .filter(payout => payout.status === 'pending')
            .reduce((sum, payout) => sum + (Number(payout.netPayable) || 0), 0);

        // Calculate revenue by event from payouts
        const revenueByEvent = {};
        for (const event of eventData) {
            const eventPayout = payoutData.find(payout => payout.eventId === event.id);
            if (eventPayout) {
                revenueByEvent[event.name] = Number(eventPayout.netPayable) || 0;
            } else {
                // Fallback to ticket calculation for events without payouts
                const eventTickets = ticketDetails.filter(ticket => ticket.eventId === event.id && ticket.status === 'CONFIRMED');
                const totalRevenue = eventTickets.reduce((sum, ticket) => sum + (Number(ticket.totalAmount) || 0), 0);
                if (totalRevenue > 0) {
                    revenueByEvent[event.name] = totalRevenue;
                }
            }
        }

        // Structure the response data
        const dashboardStats = {
            ticketsSold: ticketSold || 0,
            grossRevenue: grossRevenue || 0,
            totalEvents: totalEvents,
            pendingPayments: pendingPayments,
            revenueByEvent: revenueByEvent,
            events: eventData.map(event => ({
                id: event.id,
                name: event.name,
                type: event.type,
                sub_type: event.sub_type,
                scheduleStart: event.scheduleStart,
                scheduleEnd: event.scheduleEnd,
                totalBookings: event.totalBookings || 0,
                totalRevenue: revenueByEvent[event.name] || 0,
                verificationStatus: event.verificationStatus,
                posterUrl: event.posterUrl,
                city: event.city,
                state: event.state,
                createdAt: event.createdAt
            })),
            ticketDetails: ticketDetails.map(ticket => ({
                id: ticket.ticketId,
                eventId: ticket.eventId,
                userId: ticket.userId,
                numberOfTickets: ticket.numberOfTickets,
                totalAmount: ticket.totalAmount,
                status: ticket.status,
                createdAt: ticket.createdAt,
                eventType: ticket.eventType,
                ticketType: ticket.seatType || ticket.zone || 'General',
                seatNumbers: ticket.seat_no,
                // User details
                user: {
                    name: ticket.userName,
                    email: ticket.userEmail,
                    phone: ticket.userPhone
                }
            }))
        };

        return res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: dashboardStats
        });
    } catch (err) {
        console.error("Dashboard data error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
}
 

export const eventAnalytics = async (req, res) => {
    const { eventId } = req.params;

    try{

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "eventId is required.",
            });
        }

        const eventData = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId));

        if (!Array.isArray(eventData) || eventData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        const event = eventData[0];
        const totalTickets = event.maxParticipantAllowed;
        
        let ticketObj = {};
        let statusObj = {};
        let amountMade = 0;
        let userTicketData = [];

        if (event.isCompleted) {
            // Get data from payouts table for completed events
            const payoutData = await db
                .select()
                .from(payouts)
                .where(eq(payouts.eventId, eventId));

            if (payoutData.length > 0) {
                const payout = payoutData[0];
                amountMade = Number(payout.netPayable) || 0;
                userTicketData = payout.allTicketsDetails || [];
                
                // Process ticket data from payout
                userTicketData.forEach((ticket) => {
                    const ticketType = ticket.seatType || 'General';
                    ticketObj[ticketType] = (ticketObj[ticketType] || 0) + (ticket.numberOfTicket || 0);
                    statusObj['CONFIRMED'] = (statusObj['CONFIRMED'] || 0) + (ticket.numberOfTicket || 0);
                });
                
                // Format user ticket data to match expected structure
                userTicketData = userTicketData.map((ticket) => ({
                    name: ticket.userName,
                    email: ticket.userEmail,
                    ticket_type: ticket.seatType || 'General',
                    numberOfTickets: ticket.numberOfTicket || 0,
                    status: 'CONFIRMED',
                    baseAmount: ticket.baseAmount,
                    totalAmount: ticket.totalAmount,
                    purchasedAt: ticket.createdAt
                }));
            }
        } else {
            // Use existing logic for ongoing events
            const ticketDetails = await db
                .select({
                    ticketId: tickets.id,
                    userId: tickets.userId,
                    numberOfTickets: tickets.numberOfTickets,
                    status: tickets.status,
                    seat_type: tickets.seat_type,
                    zone: tickets.zone,
                    userName: users.name,
                    userEmail: users.email,
                    baseAmount: tickets.baseAmount,
                    totalAmount: tickets.totalAmount,
                    createdAt: tickets.createdAt
                })
                .from(tickets)
                .leftJoin(users, eq(tickets.userId, users.id))
                .where(eq(tickets.eventId, eventId));

            userTicketData = ticketDetails.map((ticket) => {
                const ticketType = ticket.seat_type || ticket.zone || 'General';
                
                if(ticket.status === 'CONFIRMED') {
                    ticketObj[ticketType] = (ticketObj[ticketType] || 0) + ticket.numberOfTickets;
                    amountMade += Number(ticket.totalAmount) || 0;
                }
                
                statusObj[ticket.status] = (statusObj[ticket.status] || 0) + ticket.numberOfTickets;
                
                return {
                    name: ticket.userName,
                    email: ticket.userEmail,
                    ticket_type: ticketType,
                    numberOfTickets: ticket.numberOfTickets,
                    status: ticket.status,
                    baseAmount: ticket.baseAmount,
                    totalAmount: ticket.totalAmount,
                    purchasedAt: ticket.createdAt 
                };
            });
        }

        const eventDetails = {
            eventName: event.name,
            posterUrl: event.posterUrl,
            eventStart: event.scheduleStart,
            eventEnd: event.scheduleEnd,
            isCompleted: event.isCompleted
        }

        const ticketAnalytics = {
            totalTickets: totalTickets,
            amountMade,
            ticketTypes: ticketObj,
            ticketStatus: statusObj,
            userTicketData: userTicketData,
            eventData: eventDetails
        };

        return res.status(200).json({
            success: true,
            message: "Event analytics fetched successfully",
            data: ticketAnalytics
        });

    } catch(err) {
        console.log("Error in event analytics : ", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
}


export const scanQR = async (req, res) => {
    const { ticketId, hash } = req.body;

    try {
        // Validate input
        if (!ticketId || !hash) {
            return res.status(400).json({
                success: false,
                message: "Ticket ID and hash are required"
            });
        }

        // Verify hash
        const expectedHash = crypto
            .createHmac("sha256", process.env.TICKET_SECRET)
            .update(ticketId.toString())
            .digest("hex");

        if (hash !== expectedHash) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR code - Authentication failed"
            });
        }

        // Fetch ticket details
        const ticketData = await db
            .select({
                ticketId: tickets.id,
                status: tickets.status,
                numberOfTickets: tickets.numberOfTickets,
                seat_type: tickets.seat_type,
                seat_no: tickets.seat_no,
                zone: tickets.zone,
                checkInStatus: tickets.checkInStatus,
                eventId: tickets.eventId,
                userName: users.name,
                userEmail: users.email,
                eventName: events.name,
                scheduleStart: events.scheduleStart,
                scheduleEnd: events.scheduleEnd
            })
            .from(tickets)
            .leftJoin(users, eq(tickets.userId, users.id))
            .leftJoin(events, eq(tickets.eventId, events.id))
            .where(eq(tickets.id, ticketId))
            .limit(1);

        if (!ticketData.length) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const ticket = ticketData[0];

        // Check ticket status
        if (ticket.status !== 'CONFIRMED') {
            return res.status(400).json({
                success: false,
                message: `Ticket is ${ticket.status.toLowerCase()} - Entry not allowed`
            });
        }

        // Check if already checked in
        if (ticket.checkInStatus === 'CHECKED_IN') {
            return res.status(400).json({
                success: false,
                message: "Ticket already used for entry"
            });
        }

        // Check event timing
        const now = new Date();
        const eventStart = new Date(ticket.scheduleStart);
        const eventEnd = new Date(ticket.scheduleEnd);
        
        // Change needed here ------> (comment out)
        // if (now < eventStart) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Event has not started yet"
        //     });
        // }
        
        if (now > eventEnd) {
            return res.status(400).json({
                success: false,
                message: "Event has already ended"
            });
        }

        // Update check-in status
        await db.update(tickets)
            .set({ checkInStatus: 'CHECKED_IN', qr_status: 'used' })
            .where(eq(tickets.id, ticketId));

        // Return success with ticket details
        return res.status(200).json({
            success: true,
            message: "Ticket verified successfully - Entry allowed",
            ticketDetails: {
                holderName: ticket.userName,
                email: ticket.userEmail,
                eventName: ticket.eventName,
                seatInfo: ticket.seat_no || ticket.zone || 'General',
                ticketType: ticket.seat_type || ticket.zone || 'General',
                numberOfTickets: ticket.numberOfTickets,
                status: ticket.status
            }
        });

    } catch (err) {
        console.error("QR scan error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error during verification"
        });
    }
}


