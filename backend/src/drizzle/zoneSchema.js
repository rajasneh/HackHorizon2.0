import { boolean, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from 'uuid';
import { events } from "./eventSchema.js";


export const zones = mysqlTable('zone_table', {
    id: varchar('id', { length: 36 }).primaryKey().notNull().$default(() => uuidv4()),
    name: varchar('zone_name', { length : 20 }),
    capacity: int('capacity').notNull(),

    ticketsSold: int('tickets_sold').default(0),
    isSoldOut: boolean('is_sold_out').default(false),

    eventId: varchar('event_id', { length: 36 })
        .references(() => events.id, {onDelete: 'cascade'}),
})