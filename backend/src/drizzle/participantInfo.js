import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from 'uuid';
import { events } from "./eventSchema.js";

export const participants = mysqlTable('participants', {
    id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).unique(),
    role: varchar('role', { length: 50 }), // student, spaeker, judge...
    affiliation: varchar('affiliation', { length: 100 }), // college, company...
    college: varchar('college', { length: 255 }),
    eventID: varchar('eventId', { length: 36 })
        .references(() => events.id, { onDelete: 'cascade' })
});
