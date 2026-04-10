import { mysqlTable, varchar, decimal, timestamp, int } from 'drizzle-orm/mysql-core';

export const refunds = mysqlTable('refunds', {
  id: int('id').primaryKey().autoincrement(),
  orderId: varchar('order_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 500 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  refundedAt: timestamp('refunded_at').defaultNow(),
  refund_id: varchar('refund_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});