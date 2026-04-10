import { decimal, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { events } from './eventSchema';
import { users } from './userSchema.js';


export const bookings = mysqlTable('bookings', {
    id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),
  
    eventId: varchar('event_id', { length: 36 }).notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
  
    userId: varchar('user_id', { length: 36 }).notNull()
        .references(() => users.id, { onDelete: 'cascade'}),
  
    ticketType: varchar('ticket_type', { length: 20 }).notNull(), // flat, normal, premium, etc.
    amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
  
    status: varchar('status', { length: 20 }).$default(() => 'active'), // active, cancelled, refunded
    createdAt: timestamp('created_at').defaultNow(),
  });
  