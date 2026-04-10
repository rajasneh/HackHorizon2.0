import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from 'uuid';
import { tickets } from "./ticketSchema.js";
import { participants } from "./participantInfo.js";

export const ticketStudents = mysqlTable('ticket_students', {
    id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),
    ticketId: varchar('ticket_id', { length: 36 }).notNull().references(() => tickets.id),
    participantsId: varchar('participants_id', { length: 36 }).notNull().references(() => participants.id),
  });
  