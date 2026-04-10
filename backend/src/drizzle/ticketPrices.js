import { mysqlTable, varchar, decimal, int } from 'drizzle-orm/mysql-core';
import { events } from './eventSchema.js'; // Import events table if you have an events table defined elsewhere.
import { v4 as uuidv4 } from 'uuid';
 
export const ticketPrices = mysqlTable('ticket_prices', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),

  eventId: varchar('event_id', {length: 36})
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),

  // Type ('flat' or 'categorized')
  pricingOption: varchar('pricing_option', { length: 20 }).notNull().default('flat'),

  numberOfTickets: int('number_of_tickets')
    .notNull()
    .default(0),

  ticketsSold: int('tickets_sold').notNull().default(0),

  // Flat price for all tickets (if flat)
  flatPrice: decimal('flat_price', { precision: 10, scale: 2 }).default('0.00'),
});



// Categories for categorized pricing 
export const ticketCategories = mysqlTable('ticket_categories', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),

  eventId: varchar('event_id', { length: 36 })
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),

  // Type of ticket (Normal, Executive...)
  type: varchar('type', { length: 50 }).notNull(),

  // Number of seats available for this ticket
  numberOfTickets: int().notNull().default(0),

  ticketsSold: int('tickets_sold').notNull().default(0),

  // Ticket price for this category
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
});
