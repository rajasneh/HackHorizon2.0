import { db } from '../config/db.js';
import { events } from '../drizzle/eventSchema.js';
import { likes } from '../drizzle/likesSchema.js';
import { tickets } from '../drizzle/ticketSchema.js';
import { issues } from '../drizzle/issueSchema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

export const getOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        const userTickets = await db.select().from(tickets)
            .where(eq(tickets.userId, userId))
            .orderBy(desc(tickets.createdAt));

        res.status(200).json({
            success: true,
            data: userTickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
}

// Like Event
export const likeEvent = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        // Check if already liked
        const existingLike = await db.select().from(likes)
            .where(and(eq(likes.userId, userId), eq(likes.eventId, eventId)));

        if (existingLike.length > 0) {
            return res.json({ success: true, message: 'Already liked' });
        }

        await db.insert(likes).values({ userId, eventId });

        // increment likes_count in events table
        await db.update(events)
            .set({ likes_count: sql`${events.likes_count} + 1` })
            .where(eq(events.id, eventId));

        res.json({ success: true, message: 'Event liked' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to like event', error: error.message });
    }
};

// Unlike Event
export const unlikeEvent = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        const deleted = await db.delete(likes)
            .where(and(eq(likes.userId, userId), eq(likes.eventId, eventId)));

        if (deleted.length > 0) {
            await db.update(events)
                .set({ likes_count: sql`${events.likes_count} - 1` })
                .where(eq(events.id, eventId));
        }

        res.json({ success: true, message: 'Event unliked' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to unlike event', error: error.message });
    }
};


// Generate QR
export const generateTktQR = async (req, res) => {
    const { orderId } = req.params;

    try{

        if(!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID not found"
            })
        }

        const checkTicket = await db.select().from(tickets)
            .where(eq(tickets.id, orderId));

        const hash = crypto
            .createHmac("sha256", process.env.TICKET_SECRET)
            .update(orderId.toString())
            .digest("hex");

        const qrData = JSON.stringify({ ticketId: orderId, hash });

        return res.status(200).json({
            success: true,
            message: "QR generated successfully",
            qrCode: qrData
        })

    } catch(err) {
        console.log("Error in generateTktQR : ",err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
}


// Submit Issue to the Admin
export const submitIssue = async (req, res) => {
    try {
        const { name, email, subject, description } = req.body;
        let imageUrl = null;

        // Validate required fields
        if (!name || !email || !subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'All fields except image are required'
            });
        }

        // Handle image upload if provided
        if (req.file) {
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { 
                            folder: 'issue-screenshots',
                            resource_type: 'image'
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
                
                imageUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload image'
                });
            }
        }

        // Insert issue into database
        await db.insert(issues).values({
            name,
            email,
            subject,
            description,
            imageUrl
        });

        res.status(201).json({
            success: true,
            message: 'Issue submitted successfully. Our team will review it and get back to you soon.'
        });

    } catch (error) {
        console.error('Error submitting issue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit issue. Please try again.',
            error: error.message
        });
    }
};