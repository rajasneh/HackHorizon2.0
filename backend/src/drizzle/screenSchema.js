import { mysqlTable, varchar, int, datetime, boolean, timestamp, json } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from 'uuid';
import { halls } from "./hallSchema.js";
import { sql } from "drizzle-orm";

export const screenTable = mysqlTable('screen_table', {
    id: varchar('id', { length: 36 }).primaryKey().notNull().$default(() => uuidv4()),

    hallId: varchar('hall_id', { length: 36 }).notNull().references(() => halls.id, { onDelete: 'cascade' }),
    screen_no: int('screen_no'),
    bookedFrom: datetime('booked_from'),
    bookedTill: datetime('booked_till'),
    isEmpty: boolean('isEmpty').default(true),
    totalSeats: int('total_seats'),
    status: varchar('status', { length: 255 }).default('available'), // available, booked, inactive

    isSeatAlloted: boolean('is_seat_alloted').default(false),
    seatTypeCounts: json('seat_type_counts'), // { Regular: 100, Executive: 50, ... }
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('(updated_at)')
        .default(sql`CURRENT_TIMESTAMP`)
        .onUpdateNow()
})