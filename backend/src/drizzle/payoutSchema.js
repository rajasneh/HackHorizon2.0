import { mysqlTable, varchar, decimal, timestamp, text, json, boolean } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { events } from './eventSchema.js';
import { organiser } from './organiserSchema.js';
import { sql } from 'drizzle-orm';
import { admins } from './adminSchema.js';
 
export const payouts = mysqlTable('payouts', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),
  
  eventId: varchar('event_id', { length: 36 }).notNull().references(() => events.id),
  organizerId: varchar('organizer_id', { length: 36 }).notNull().references(() => organiser.id),
  adminId: varchar('admin_id', { length: 36 }),

  totalRevenue: decimal('total_revenue', { precision: 10, scale: 2 }).notNull(),
  deductions: decimal('deductions', { precision: 10, scale: 2 }).default('0.00'),
  netPayable: decimal('net_payable', { precision: 10, scale: 2 }).notNull(),
  
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'paid', 'cancelled'
  
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  paidAt: timestamp('paid_at'),

  availableToOrg: boolean('available_to_org').default(false),
  paymentToOrg: boolean('payment_to_org').default(false),

  allTicketsDetails: json('all_tickets_details'),
  
  paymentMethod: varchar('payment_method', { length: 20 }), // 'UPI', 'Bank Transfer', 'RazorpayX'
  transactionReference: varchar('transaction_reference', { length: 255 }),
  notes: text('notes')
});