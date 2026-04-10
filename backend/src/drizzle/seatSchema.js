import { mysqlTable, int, varchar, boolean, decimal } from 'drizzle-orm/mysql-core';
import { halls } from './hallSchema.js'; // assuming halls table exists
import { screenTable } from './screenSchema.js';
import { v4 as uuidv4 } from 'uuid'; 

export const seats = mysqlTable('seats', {
  id: varchar('id', { length: 36 }).primaryKey().notNull().$default(() => uuidv4()),

  hallId: varchar('hall_id', {length: 36}).notNull().references(() => halls.id, {onDelete: 'cascade'}),
  screenId: varchar('screenId', {length: 36}).notNull().references(() => screenTable.id, {onDelete: 'cascade'}),

  seat_label: varchar('seat_label', { length: 20 }),
  row: varchar('row', { length: 2 }), // Row label (A, B, ...)
  col: decimal('col', { precision: 4, scale: 1 }), // Column number, float for gap support
  seatType: varchar('seat_type', { length: 50 }).default('Regular'), // e.g. VIP, Premium
  isGap: boolean('is_gap').default(false), // True if this is a gap placeholder
  isBlocked: boolean('is_blocked').default(false),         // for temporarily/permanently disabled seats
  isBooked: boolean('is_booked').default(false),
});
