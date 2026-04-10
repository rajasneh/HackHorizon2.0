import createRazorpayInstance from "../config/razorpay.js";
import crypto from "crypto";
import { completeBooking } from "../services/ticketBookingServices.js";
import { db } from "../config/db.js";
import { tickets } from "../drizzle/ticketSchema.js";
import { refunds } from "../drizzle/refundSchema.js";
import { users } from "../drizzle/userSchema.js";
import { events } from "../drizzle/eventSchema.js";
import { organiser } from "../drizzle/organiserSchema.js";
import { seats } from "../drizzle/seatSchema.js";
import { ticketPrices, ticketCategories } from "../drizzle/ticketPrices.js";
import { eq, sql, inArray, and } from "drizzle-orm";
import { sendRefundEmail, sendRefundCompletedEmail } from "../mail-syntax/refund.js";
import { payouts } from "../drizzle/payoutSchema.js";

// Helper function to update counts when ticket is cancelled
const updateCountsOnCancellation = async (ticket) => {
    try {
        if (ticket.eventType === 'Seating') {
            // Free up seats for seating events
            if (ticket.seatNumbers) {
                await db.update(seats)
                    .set({ isBooked: false })
                    .where(inArray(seats.id, ticket.seatNumbers));
            }
        } else {
            // For non-seating events, reverse ticket counts using zone info
            if (ticket.zone) {
                // Check if it's a flat price or category-based ticket
                if (ticket.zone.includes('flat')) {
                    // Update ticket_prices table
                    await db.update(ticketPrices)
                        .set({ ticketsSold: sql`tickets_sold - ${ticket.numberOfTickets}` })
                        .where(eq(ticketPrices.id, ticket.zone));
                } else {
                    // Update ticket_categories table
                    await db.update(ticketCategories)
                        .set({ ticketsSold: sql`tickets_sold - ${ticket.numberOfTickets}` })
                        .where(eq(ticketCategories.id, ticket.zone));
                }
            }
        }

        // Update event's totalBookings count
        await db.update(events)
            .set({ totalBookings: sql`total_bookings - ${ticket.numberOfTickets}` })
            .where(eq(events.id, ticket.eventId));

        // Update organiser's ticket_sold count and revenue
        const event = await db.select().from(events).where(eq(events.id, ticket.eventId));
        if (event.length > 0) {
            const revenueToDeduct = ticket.baseAmount || (ticket.totalAmount - (ticket.totalConvenienceFee || 0));
            await db.update(organiser)
                .set({
                    ticketSold: sql`ticket_sold - ${ticket.numberOfTickets}`,
                    grossRevenue: sql`gross_revenue - ${revenueToDeduct}`
                })
                .where(eq(organiser.id, event[0].organiserID));
        }
    } catch (error) {
        console.error('Error updating counts on cancellation:', error);
        throw error; // Re-throw to handle in main function
    }
};

export const createOrder = async (req, res) => {
    try {
        const { eventId, userId } = req.body;
        const { totalAmount, totalSeatAmount, totalConvenienceFee, gstAmount, itemDetails } = req.calculatedPrices;
        const { event } = req.priceInfo;

        // Validate required data
        if (!eventId || !userId) {
            console.log("Missing eventId or userId")
            return res.status(400).json({ error: "Missing eventId or userId" });
        }

        if (!totalAmount || totalAmount <= 0) {
            return res.status(400).json({ error: "Invalid order amount" });
        }

        // Create Razorpay instance
        const razorpay = createRazorpayInstance();

        // Create Razorpay order
        const orderOptions = {
            amount: Math.round(totalAmount * 100), // Convert to paise
            currency: "INR",
            receipt: `order_${eventId.slice(0, 6)}_${userId.slice(0, 6)}_${Date.now()}`,
            notes: {
                eventId: eventId,
                userId: userId,
                eventName: event.eventName || "Event",
                itemCount: itemDetails.length
            }
        };

        let razorpayOrder;
        try {
            razorpayOrder = await razorpay.orders.create(orderOptions);
        } catch (razorpayError) {
            console.error("Razorpay order creation failed:", razorpayError);
            return res.status(500).json({ 
                error: "Payment gateway error",
                message: "Failed to create payment order" 
            });
        }

        // Return order details
        return res.status(200).json({
            success: true,
            orderId: razorpayOrder.id,
            amount: totalAmount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            orderDetails: {
                totalSeatAmount,
                totalConvenienceFee,
                gstAmount,
                totalAmount,
                itemDetails
            },
            eventDetails: { 
                eventId,
                eventName: event.eventName,
                eventType: event.type
            }
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ 
            error: "Failed to create order",
            message: error.message 
        });
    }
}


export const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment details" });
    }

    const razorpay = createRazorpayInstance();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {

        try{
            await completeBooking({
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                eventId: req.body.eventId,
                userId: req.body.userId,
                selectedSeats: req.body.selectedSeats,
                eventDetails: req.body.eventDetails,
                categories: req.body.categories,
                totalAmount: req.body.totalAmount,
                totalConvenienceFee: req.body.totalConvenienceFee
            });
        } catch(error) {
            console.error("Error completing booking:", error);
            return res.status(500).json({
                error: "Failed to complete booking",
                message: error.message
            });
        }
        return res.status(200).json({ success: true, message: "Payment verified" });
    } else {
        return res.status(400).json({ error: "Invalid signature" });
    }
}


export const refundPayment = async (req, res) => {
    const { orderId, refundAmount } = req.body;

    // Input validation
    if (!orderId) {
        return res.status(400).json({ 
            success: false,
            error: "Order ID is required" 
        });
    }

    try {
        // Security Check 1: Verify ticket exists and get details
        const ticketData = await db
            .select()
            .from(tickets)
            .where(eq(tickets.orderId, orderId));

        if (ticketData.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Ticket not found" 
            });
        }

        const ticket = ticketData[0];

        // Security Check 2: Verify ticket can be cancelled (must be CONFIRMED)
        if (ticket.status !== "CONFIRMED") {
            return res.status(400).json({ 
                success: false,
                error: "Only confirmed tickets can be cancelled" 
            });
        }

        // Update ticket status to CANCELLED - REFUND DUE
        await db
            .update(tickets)
            .set({ 
                status: 'CANCELLED - REFUND DUE',
                updatedAt: new Date()
            })
            .where(eq(tickets.orderId, orderId));

        // Update organiser and event counts immediately upon cancellation
        try {
            await updateCountsOnCancellation(ticket);
        } catch (countError) {
            console.error('Failed to update counts on cancellation:', countError);
            // Revert ticket status if count update fails
            await db.update(tickets)
                .set({ status: 'CONFIRMED', updatedAt: new Date() })
                .where(eq(tickets.orderId, orderId));
            return res.status(500).json({
                success: false,
                error: 'Failed to process cancellation',
                message: 'Could not update booking counts'
            });
        }

        // Security Check 3: Check if refund already exists
        const existingRefund = await db
            .select()
            .from(refunds)
            .where(eq(refunds.orderId, orderId));

        if (existingRefund.length > 0 && existingRefund[0].status !== 'failed') {
            return res.status(400).json({ 
                success: false,
                error: "Refund already processed or in progress" 
            });
        }

        // Security Check 4: Verify refund amount matches ticket amount
        const expectedRefundAmount = parseFloat(ticket.totalAmount);
        const requestedRefundAmount = refundAmount ? parseFloat(refundAmount) : expectedRefundAmount;

        if (requestedRefundAmount > expectedRefundAmount) {
            return res.status(400).json({ 
                success: false,
                error: "Refund amount cannot exceed ticket amount" 
            });
        }

        // Security Check 5: Verify payment ID exists
        if (!ticket.paymentId) {
            return res.status(400).json({ 
                success: false,
                error: "Payment ID not found for this ticket" 
            });
        }

        // Create Razorpay instance
        const razorpay = createRazorpayInstance();

        // Prepare refund data for Razorpay
        const refundData = {
            amount: Math.round(requestedRefundAmount * 100), // Convert to paise
            notes: {
                orderId: orderId,
                ticketId: ticket.id,
                eventId: ticket.eventId,
                reason: 'User cancellation'
            }
        };

        let razorpayRefund;
        try {
            // Call Razorpay refund API
            razorpayRefund = await razorpay.payments.refund(ticket.paymentId, refundData);
        } catch (razorpayError) {
            console.error("Razorpay refund failed:", razorpayError);
            
            // Update existing refund record to failed or create new one
            if (existingRefund.length > 0) {
                await db
                    .update(refunds)
                    .set({ 
                        status: 'failed',
                        updatedAt: new Date()
                    })
                    .where(eq(refunds.orderId, orderId));
            } else {
                await db.insert(refunds).values({
                    orderId: orderId,
                    amount: requestedRefundAmount,
                    status: 'failed',
                    reason: 'Razorpay API error'
                });
            }

            return res.status(500).json({ 
                success: false,
                error: "Refund processing failed",
                message: razorpayError.message || "Payment gateway error"
            });
        }

        // Save refund details to database with 'processing' status
        const refundRecord = {
            orderId: orderId,
            amount: requestedRefundAmount,
            status: 'processing',
            reason: 'User cancellation'
        };

        if (existingRefund.length > 0) {
            // Update existing failed refund
            await db
                .update(refunds)
                .set({ 
                    ...refundRecord,
                    updatedAt: new Date()
                })
                .where(eq(refunds.orderId, orderId));
        } else {
            // Create new refund record
            await db.insert(refunds).values(refundRecord);
        }

        // Send refund initiation email
        try {
            const userData = await db
                .select({ email: users.email })
                .from(users)
                .where(eq(users.id, ticket.userId));
            
            if (userData.length > 0) {
                const userEmail = userData[0].email;
                const eventData = await db
                    .select({ name: events.name })
                    .from(events)
                    .where(eq(events.id, ticket.eventId));
                
                const emailDetails = {
                    orderId,
                    eventName: eventData.length > 0 ? eventData[0].name : 'Event',
                    refundAmount: requestedRefundAmount,
                    refundId: razorpayRefund.id,
                    estimatedProcessingTime: '5-7 business days'
                };
                
                await sendRefundEmail(userEmail, emailDetails);
            }
        } catch (emailError) {
            console.error('Error sending refund initiation email:', emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Refund initiated successfully",
            data: {
                refundId: razorpayRefund.id,
                orderId: orderId,
                amount: requestedRefundAmount,
                status: 'processing',
                estimatedProcessingTime: '5-7 business days'
            }
        });

    } catch (error) {
        console.error("Error processing refund:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
};

// Webhook handler for Razorpay refund events
export const handleRefundWebhook = async (req, res) => {
    try {
        // Security Check: Verify webhook signature
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        if (!webhookSignature || !webhookSecret) {
            console.error('Missing webhook signature or secret');
            return res.status(400).json({ error: 'Invalid webhook request' });
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature !== webhookSignature) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const { event, payload } = req.body;
        
        // Handle refund processed event
        if (event === 'refund.processed') {
            const refundData = payload.refund.entity;
            const orderId = refundData.notes?.orderId;
            
            if (!orderId) {
                console.error('Order ID not found in refund webhook');
                return res.status(400).json({ error: 'Order ID missing' });
            }

            // Update refund status to completed
            await db
                .update(refunds)
                .set({ 
                    status: 'completed',
                    refundedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(refunds.orderId, orderId));

            // Update ticket status to CANCELLED - REFUND PROCESSED
            await db
                .update(tickets)
                .set({ 
                    status: 'CANCELLED - REFUND PROCESSED',
                    updatedAt: new Date()
                })
                .where(eq(tickets.orderId, orderId));

            console.log(`Refund completed for order: ${orderId}`);
            
            // Send refund completion email
            try {
                const ticketData = await db
                    .select()
                    .from(tickets)
                    .where(eq(tickets.orderId, orderId));
                
                if (ticketData.length > 0) {
                    const userData = await db
                        .select({ email: users.email })
                        .from(users)
                        .where(eq(users.id, ticketData[0].userId));
                    
                    if (userData.length > 0) {
                        const eventData = await db
                            .select({ name: events.name })
                            .from(events)
                            .where(eq(events.id, ticketData[0].eventId));
                        
                        const emailDetails = {
                            orderId,
                            eventName: eventData.length > 0 ? eventData[0].name : 'Event',
                            refundAmount: refundData.amount / 100, // Convert from paise
                            refundId: refundData.id
                        };
                        
                        await sendRefundCompletedEmail(userData[0].email, emailDetails);
                    }
                }
            } catch (emailError) {
                console.error('Error sending refund completion email:', emailError);
            }
            
        } 
        // Handle refund failed event
        else if (event === 'refund.failed') {
            const refundData = payload.refund.entity;
            const orderId = refundData.notes?.orderId;
            
            if (!orderId) {
                console.error('Order ID not found in failed refund webhook');
                return res.status(400).json({ error: 'Order ID missing' });
            }

            // Update refund status to failed
            await db
                .update(refunds)
                .set({ 
                    status: 'failed',
                    reason: 'Refund failed at payment gateway',
                    updatedAt: new Date()
                })
                .where(eq(refunds.orderId, orderId));

            console.log(`Refund failed for order: ${orderId}`);
        }

        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ 
            error: 'Webhook processing failed',
            message: error.message 
        });
    }
};



export const payoutSummary = async (req, res) => {
    try {
        // Get all payouts
        const payoutRows = await db.select().from(payouts);

        // For each payout, fetch event and organiser names
        const enrichedPayouts = await Promise.all(
            payoutRows.map(async (payout) => {
                // Get event name
                let eventName = null;
                if (payout.eventId) {
                    const eventData = await db
                        .select({ name: events.name })
                        .from(events)
                        .where(eq(events.id, payout.eventId));
                    eventName = eventData.length > 0 ? eventData[0].name : null;
                }

                // Get organiser name
                let organiserName = null;
                if (payout.organizerId) {
                    const organiserData = await db
                        .select({ name: organiser.name })
                        .from(organiser)
                        .where(eq(organiser.id, payout.organizerId));
                    organiserName = organiserData.length > 0 ? organiserData[0].name : null;
                }

                return {
                    ...payout,
                    eventName,
                    organiserName
                };
            })
        );

        return res.status(200).json({ success: true, data: enrichedPayouts });
    } catch (error) {
        console.error("Error fetching payout summary:", error);
        return res.status(500).json({ 
            error: "Failed to fetch payout summary",
            message: error.message 
        });
    }
}


export const payoutDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch payout details by ID
        const payout = await db
            .select()
            .from(payouts)
            .where(eq(payouts.id, id));

        if (!payout) {
            return res.status(404).json({ error: "Payout not found" });
        }

        // Enrich payout with event and organiser names
        let eventName = null;
        if (payout[0].eventId) {
            const eventData = await db
                .select({ name: events.name })
                .from(events)
                .where(eq(events.id, payout[0].eventId));
            eventName = eventData.length > 0 ? eventData[0].name : null;
        }

        let organiserName = null;
        if (payout[0].organizerId) {
            const organiserData = await db
                .select({ name: organiser.name })
                .from(organiser)
                .where(eq(organiser.id, payout[0].organizerId));
            organiserName = organiserData.length > 0 ? organiserData[0].name : null;
        }

        return res.status(200).json({ success: true, data: { ...payout[0], eventName, organiserName } });
    } catch (error) {
        console.error("Error fetching payout details:", error);
        return res.status(500).json({
            error: "Failed to fetch payout details",
            message: error.message
        });
    }
}

export const payoutSendReceipt = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch payout details by ID
        const payout = await db
            .select()
            .from(payouts)
            .where(eq(payouts.id, id));

        if (!payout) {
            return res.status(404).json({ error: "Payout not found" });
        }

        await db.update(payouts).set({ availableToOrg: true }).where(eq(payouts.id, id));

        return res.status(200).json({ success: true, message: "Receipt sent successfully" });
    } catch (error) {
        console.error("Error sending payout receipt:", error);
        return res.status(500).json({
            error: "Failed to send payout receipt",
            message: error.message
        });
    }
}

export const payoutMarkAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationText } = req.body;

        if (verificationText !== process.env.VERIFICATION_TEXT) {
            return res.status(403).json({ error: "Invalid verification text" });
        }

        // Fetch payout details by ID
        const payout = await db
            .select()
            .from(payouts)
            .where(eq(payouts.id, id));

        if (!payout) {
            return res.status(404).json({ error: "Payout not found" });
        }

        await db.update(payouts).set({ status: 'paid', paidAt: new Date() }).where(eq(payouts.id, id));

        return res.status(200).json({ success: true, message: "Payout marked as paid" });
    } catch (error) {
        console.error("Error marking payout as paid:", error);
        return res.status(500).json({
            error: "Failed to mark payout as paid",
            message: error.message
        });
    }
}

export const payoutPaymentInitiated = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentMethod = req.body.paymentMethod;
        const adminId = req.body.adminId;

        // Fetch payout details by ID
        const payout = await db
            .select()
            .from(payouts)
            .where(eq(payouts.id, id));

        if (!payout) {
            return res.status(404).json({ error: "Payout not found" });
        }

        await db.update(payouts).set({ paymentToOrg: true, paymentMethod, adminId }).where(eq(payouts.id, id));

        return res.status(200).json({ success: true, message: "Payout payment initiated" });
    } catch (err) {
        console.error("Error initiating payout payment:", err);
        return res.status(500).json({
            error: "Failed to initiate payout payment",
            message: err.message
        });
    }
}

export const getAllPayoutsForOrg = async (req, res) => {
    try{
        const organiserId = req.params.id;

        // Fetch all payouts for this organiser
        const payoutRows = await db
            .select()
            .from(payouts)
            .where(and(
                eq(payouts.organizerId, organiserId),
                eq(payouts.availableToOrg, true)
            ));

        // Enrich each payout with event name
        const enrichedPayouts = await Promise.all(
            payoutRows.map(async (payout) => {
                let eventName = null;
                if (payout.eventId) {
                    const eventData = await db
                        .select({ name: events.name })
                        .from(events)
                        .where(eq(events.id, payout.eventId));
                    eventName = eventData.length > 0 ? eventData[0].name : null;
                }

                return {
                    ...payout,
                    eventName
                };
            })
        );

        return res.status(200).json({ success: true, data: enrichedPayouts });
    } catch(err){
        console.error("Error fetching payouts for organiser:", err);
        return res.status(500).json({
            error: "Failed to fetch payouts for organiser",
            message: err.message
        });
    }
}