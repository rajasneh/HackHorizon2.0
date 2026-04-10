import { sql } from "drizzle-orm";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from 'uuid';


export const organiser = mysqlTable('organiser_table', {
    id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),
    name: varchar('name', { length: 50 }).notNull(),
    email: varchar('email', { length: 50 }).notNull().unique(),
    phone: varchar('phone', { length: 12 }).notNull().unique(),
    role: varchar('role', { length: 20 }).default('organiser'),

    ticketSold: int('ticket_sold').default('0'),
    grossRevenue: int('gross_revenue').default('0'),

    // payment details (manual)
    account_holder_name: varchar('account_holder_name', {length: 200}).default(''),
    upi_id: varchar('upi_id', {length: 200}).default(''),

    status: varchar('status', {length: 30}).default('active'),  // banned, active, suspended

    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .default(sql`CURRENT_TIMESTAMP`) 
        .onUpdateNow()
})