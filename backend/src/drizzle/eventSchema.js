import { mysqlTable, varchar, text, datetime, boolean, json, int, double } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { ticketPrices } from './ticketPrices.js';
import { organiser } from './organiserSchema.js';
import { halls } from './hallSchema.js' 
import { screenTable } from './screenSchema.js';

export const events = mysqlTable('events_table', {
  id: varchar('id', { length: 36 }).primaryKey().notNull().$default(() => uuidv4()),
  name: varchar('name', { length: 255 }).notNull(),

  organiserID: varchar('organiser_id', { length: 36 }) 
    .default(null)
    .references(() => organiser.id, { onDelete: 'set null' }),

  type: varchar('type', { length: 100 }).notNull(), // seating, online, ground, registration 
  sub_type: varchar('sub_type', { length: 100 }).notNull(), // movie, concert, online,  etc.
  genre: varchar('genre', { length: 100 }), // e.g., action, drama, comedy, etc.
  description: text('description'),

  language: varchar('language', { length: 100 }).default('Hindi'),
  ratingCode: varchar('rating_code', { length: 20 }).default('U'),  // U=Universal, A=Adults, UA=Parental Guidance

  scheduleStart: datetime('schedule_start').notNull(),
  scheduleEnd: datetime('schedule_end').notNull(),

  location: varchar('location', { length: 255 }),
  city: varchar('city', { length: 50 }),
  state: varchar('state', { length: 50 }),
  area_name: varchar('area_name', { length: 100 }),

  isOnline: boolean('is_online').default(false).notNull(), 
 
  priceID: varchar('tktPrice_id', { length: 36 })
    .default(null)
    .references(() => ticketPrices.id, { onDelete: 'set null' }),

  hallsAvailable: json('halls_available'), // Only used for movie-type events (can be null)

  hallID: varchar('hall_id', { length: 36 })
    .default(null)
    .references(() => halls.id, { onDelete: 'cascade' }), 

  screenID: varchar('screen_id', { length: 36 })
    .default(null)
    .references(() => screenTable.id, { onDelete: 'cascade' }), 


  posterUrl: varchar('poster_url', { length: 500 }),

  isVerified: boolean('is_verified').default(false).notNull(),
  verificationStatus: varchar('verification_status', { length: 255 }).default('pending').notNull(), // pending, approved, rejected

  isPublished: boolean('is_published').default(false).notNull(),
  isPaid: boolean('isPaid').default(true), 
  isCompleted: boolean('is_completed').default(false), 

  ticketsAvailable: int('tickets_available').default(0),
  maxParticipantAllowed: int('maxParticipantAllowed').default(0),
  likes_count: int('likes_count').default(0),
  isRefundable: boolean('is_refundable').default(false),
  isTicketsCancelleable: boolean('is_ticket_cancelleable').default(false),

  eventInstructions: text('event_instructions'),
  requiresRegistration: boolean('requires_registration').default(false),
  isPaymentMade: boolean('is_payment_made').default(false),

  rating: double('rating').default(0), // 0-5 scale
  totalReviews: int('total_reviews').default(0), // total number of reviews
  totalBookings: int('total_bookings').default(0), // total number of bookings made for this event
  eligibility_age: int('eligibility_age').default(0), // minimum age required to attend the event
  eligibility_criteria: text('eligibility_criteria'),

  // registration
  participationType: varchar('participation_type', { length: 20 }),
  minTeamMembers: int('min_members').default(0),
  maxTeamMembers: int('max_members').default(0),
  formSchemaID: varchar('form_id', { length: 50 }),

  // online event
  platformForOnlineEvent: varchar('onlineEventPlatform', { length: 20 }),
  eventLink: varchar('eventLink', { length: 100 }),

  // Booking control fields:
  bookingCutoffType: varchar('booking_cutoff_type', { length: 20 }).notNull().default('until_sold'), // 'until_sold', 'before_start', 'custom_time'
  bookingCutoffMinutesBeforeStart: int('booking_cutoff_minutes_before_start'), // optional
  bookingCutoffTimestamp: datetime('booking_cutoff_timestamp'), // optional
  bookingCloseTime: datetime('booking_close_time'), // actual calculated cutoff time

  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});
