import { db } from "../config/db.js";
import { events } from "../drizzle/eventSchema.js";
import { ticketPrices, ticketCategories } from "../drizzle/ticketPrices.js";
import { tickets } from "../drizzle/ticketSchema.js";
import { likes } from "../drizzle/likesSchema.js";
import { gte, asc, inArray, eq } from "drizzle-orm";
import buildEventConciergePrompt from "../utils/aiPrompt.js";
import { groq } from "../ai/groq.js";

export const aiResponse = async (req, res) => {
  try {
    const { userId, user_msg, conversation } = req.body;

    // get all the upcoming event's requested details
    const upcomingEventsData = await db.select()
      .from(events)
      .where(gte(events.scheduleStart, new Date()))
      .orderBy(asc(events.scheduleStart))
      .limit(10);    

    const eventIds = upcomingEventsData.map(e => e.id);
    let prices = [];
    let categories = [];
    
    if (eventIds.length > 0) {
      prices = await db.select().from(ticketPrices).where(inArray(ticketPrices.eventId, eventIds));
      categories = await db.select().from(ticketCategories).where(inArray(ticketCategories.eventId, eventIds));
    }

    const upcomingEvents = upcomingEventsData.map(event => {
       const eventPrice = prices.find(p => p.eventId === event.id);
       const eventCategories = categories.filter(c => c.eventId === event.id);
       
       let displayPrice = "Free/Not specified";
       if (eventPrice) {
          if (eventPrice.pricingOption === 'flat') {
              displayPrice = eventPrice.flatPrice;
          } else if (eventCategories.length > 0) {
              displayPrice = eventCategories.map(c => ({ type: c.type, price: c.price }));
          }
       }

       return {
           name: event.name,
           scheduleStart: event.scheduleStart,
           location: {
               city: event.city,
               state: event.state,
               area: event.area_name
           },
           ticketPrice: displayPrice,
           type: event.type,
           subtype: event.sub_type,
           isCancellable: event.isTicketsCancelleable,
           eligibilityAge: event.eligibility_age,
           description: event.description
       };
    });

    let bookingHistory = [];
    let likedEvents = [];

    // fetch user-specific data if userId is provided
    if (userId) {
      bookingHistory = await db.select({
          id: tickets.id,
          eventId: tickets.eventId,
          eventName: events.name,
          numberOfTickets: tickets.numberOfTickets,
          totalAmount: tickets.totalAmount,
          status: tickets.status,
          createdAt: tickets.createdAt
      })
      .from(tickets)
      .leftJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, userId));

      likedEvents = await db.select({
          id: likes.id,
          eventId: likes.eventId,
          eventName: events.name,
          createdAt: likes.createdAt
      })
      .from(likes)
      .leftJoin(events, eq(likes.eventId, events.id))
      .where(eq(likes.userId, userId));
    }

    const { systemPrompt, userPrompt } = buildEventConciergePrompt({
      upcomingEvents,
      bookingHistory,
      likedEvents,
      conversationHistory: conversation || [],
      userMessage: user_msg || ""
    });

    // pass the prompt to AI and get the response and send it to frontend
    const aiMessage = await groq(systemPrompt, userPrompt);

    return res.json({ response: aiMessage });

  } catch(err) {
    console.error("AI Error:", err);
    return res.status(500).json({ error: "An error occurred while processing the AI response." });
  }
};
