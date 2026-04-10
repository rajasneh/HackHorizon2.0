import { mysqlTable, int, varchar, json, timestamp, boolean, decimal } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { seats } from './seatSchema.js';

export const halls = mysqlTable('halls', {
  id: varchar('id', { length: 36 }).primaryKey().notNull().$default(() => uuidv4()),
  name: varchar('name', { length: 100 }).notNull(),
  area_name: varchar('area_name', { length: 255 }),

  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  seatLayoutId: varchar('seat_layout_id', { length: 36 })
    .references(() => seats.id),

  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  totalScreens: json('total_screens'),  // JSON array to store screen IDs
  numberOfScreens: int('number_of_screens'),

  isVerified: boolean('isVerified').default(false),
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, booked
  verificationStatus: varchar('verification_status', { length: 255 }).default('pending'),  // pending, rejected, approved

  // Stores the ID of the user who created the hall
  createdById: varchar('created_by_id', { length: 36 }).notNull(),

  // Stores whether it was an admin or organiser
  createdByType: varchar('created_by_type', { length: 20 })
    .notNull()
    .default('organiser'), // or 'admin'

  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('(updated_at)')
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
});

