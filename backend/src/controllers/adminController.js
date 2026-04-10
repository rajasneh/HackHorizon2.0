import { db } from "../config/db.js";
import { events } from "../drizzle/eventSchema.js";
import { eq, count, sum, desc, sql } from "drizzle-orm";
import { organiser } from "../drizzle/organiserSchema.js";
import { users } from "../drizzle/userSchema.js";
import { tickets } from "../drizzle/ticketSchema.js";
import { issues } from "../drizzle/issueSchema.js";


export const eventApproval = async (req, res) => {
    try {
        // Fetch pending events and join with organiser to get organiser name
        const pendingEvents = await db
            .select({
                ...events,
                organiserName: organiser.name
            })
            .from(events)
            .leftJoin(organiser, eq(events.organiserID, organiser.id))
            .where(eq(events.verificationStatus, "pending")); // Note: status is 'pending' (lowercase) in schema

        res.status(200).json({
            success: true,
            message: "Pending events fetched successfully",
            data: pendingEvents,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching pending events",
            error: error.message,
        });
    }
};


export const approveReq = async (req, res) => {
    try {
        const { eventId } = req.body;
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "eventID is required"
            });
        }

        const updated = await db
            .update(events)
            .set({ verificationStatus: "approved", isVerified: true })
            .where(eq(events.id, eventId));

        if (updated.affectedRows === 0 && updated.length === 0) {
            // drizzle-orm may return affectedRows or an array depending on dialect
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event approved successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error approving event",
            error: error.message
        });
    }
};


export const rejectReq = async (req, res) => {
    try {
        const { eventId, reason } = req.body;
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "eventID is required"
            });
        }

        // Optionally, you can store the rejection reason in a field if your schema supports it.
        // For now, just update the status.
        const updated = await db
            .update(events)
            .set({ verificationStatus: "rejected", isVerified: false })
            .where(eq(events.id, eventId));

        if (updated.affectedRows === 0 && updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event rejected successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error rejecting event",
            error: error.message
        });
    }
};


export const adminDashboard = async (req, res) => {
    try {
        // Get basic counts
        const [totalEventsCount] = await db.select({ count: count() }).from(events);
        const [totalOrganisersCount] = await db.select({ count: count() }).from(organiser);
        const [totalUsersCount] = await db.select({ count: count() }).from(users);
        
        // Get all the issues that are not resolved yet
        const issuesCount = await db.select().from(issues).where(eq(issues.status, 'open'));
        
        // Get ticket statistics
        const [ticketStats] = await db.select({
            ticketSold: sum(tickets.numberOfTickets),
            grossRevenue: sum(tickets.totalAmount),
            totalCancellations: count()
        }).from(tickets).where(eq(tickets.status, 'CONFIRMED'));
        
        const [cancellationStats] = await db.select({
            totalCancellations: count()
        }).from(tickets).where(eq(tickets.status, 'CANCELLED - REFUND PROCESSED'));

        // Get top 5 organisers with their details
        const topOrganisers = await db.select({
            name: organiser.name,
            email: organiser.email,
            phoneNo: organiser.phone,
            totalEvents: count(events.id)
        })
        .from(organiser)
        .leftJoin(events, eq(organiser.id, events.organiserID))
        .groupBy(organiser.id, organiser.name, organiser.email, organiser.phone)
        .orderBy(desc(count(events.id)))
        .limit(6);

        // Get recent events with revenue data
        const recentEvents = await db.select({
            eventId: events.id,
            name: events.name,
            startDate: events.scheduleStart,
            totalBookings: events.totalBookings,
            organiserName: organiser.name
        })
        .from(events)
        .leftJoin(organiser, eq(events.organiserID, organiser.id))
        .orderBy(desc(events.createdAt))
        .limit(6);

        // Calculate revenue for each event
        const eventsWithRevenue = await Promise.all(
            recentEvents.map(async (event) => {
                const [revenue] = await db.select({
                    revenue: sum(tickets.totalAmount)
                })
                .from(tickets)
                .where(eq(tickets.eventId, event.eventId));
                
                return {
                    ...event,
                    revenue: revenue.revenue || 0
                };
            })
        );

        // Get all tickets data with user and event details
        const allTicketsData = await db.select({
            userName: users.name,
            userEmail: users.email,
            eventName: events.name,
            ticketBookedAt: tickets.createdAt,
            orderId: tickets.orderId
        })
        .from(tickets)
        .leftJoin(users, eq(tickets.userId, users.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .orderBy(desc(tickets.createdAt))
        .limit(6);

        res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: {
                totalEvents: totalEventsCount.count,
                issuesCount: issuesCount.length,
                issues: issuesCount,
                totalOrganisers: totalOrganisersCount.count,
                totalUsers: totalUsersCount.count,
                ticketSold: ticketStats.ticketSold || 0,
                grossRevenue: ticketStats.grossRevenue || 0,
                totalCancellations: cancellationStats.totalCancellations || 0,
                organisers: topOrganisers,
                events: eventsWithRevenue,
                ticketsData: allTicketsData
            }
        });
    } catch (error) {
        console.log("Error : ", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard data",
            error: error.message
        });
    }
}



export const issueResolved = async (req, res) => {
    const { issueId } = req.body;

    try {
        const updated = await db.update(issues)
            .set({ status: 'resolved' })
            .where(eq(issues.id, issueId));

        if (updated.affectedRows === 0 && updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Issue not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Issue resolved successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error resolving issue",
            error: error.message
        });
    }
}

export const getAllIssues = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Get total count of issues
    const totalResult = await db
      .select({ count: count() })
      .from(issues);

    const total = Number(totalResult[0]?.count ?? 0);

    // ✅ Get paginated issues
    const paginatedIssues = await db
      .select()
      .from(issues)
      .limit(limit)
      .offset(offset);

    res.status(200).json({
      success: true,
      message: "Issues fetched successfully",
      issues: paginatedIssues,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issues",
      error: error.message,
    });
  }
};
