
import { mysqlTable, int, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { users } from './userSchema.js';
import { events } from './eventSchema.js';

export const likes = mysqlTable('likes', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', {length: 36}).references(() => users.id, {onDelete: ('cascade')}).notNull(),
  eventId: varchar('event_id', {length: 36}).references(() => events.id ,{onDelete: ('cascade')}).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});