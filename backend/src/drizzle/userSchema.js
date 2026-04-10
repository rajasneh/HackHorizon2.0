import { mysqlTable, int, varchar, timestamp, boolean, text } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()),

  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),

  phone: varchar('phone', { length: 12 }),
  isVerified: boolean('is_verified').default(false),

  role: varchar('role', { length: 10 }).default('user'),

  profilePic: text('profile_pic'), // URL to profile picture (optional)
  googleId: varchar('google_id', { length: 255 }),

  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
});
