import { mysqlTable, varchar, text, timestamp } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

export const issues = mysqlTable('issues', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),
  
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  
  status: varchar('status', { length: 20 }).default('open'), // 'open', 'resolved'
  
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow()
});