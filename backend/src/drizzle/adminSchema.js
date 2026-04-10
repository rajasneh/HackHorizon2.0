import { sql } from 'drizzle-orm';
import { mysqlTable, varchar, boolean, datetime, text, json, int, timestamp } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';

export const admins = mysqlTable('admins', {
    id: varchar('id', { length: 36 }).primaryKey().$default(() => uuidv4()), // UUID or custom ID
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 150 }).notNull().unique(),
    phone: varchar('phone', { length: 12 }),
    password: varchar('password', { length: 255 }).notNull(),

    role: varchar('role', { length: 50 }).default('moderator'), // e.g., 'superadmin', 'moderator', etc.
    permissions: json('permissions'), // Optional: fine-grained permission control

    isActive: boolean('is_active').default(true),
    lastLogin: datetime('last_login'),

    totpSecret: varchar('totp_secret', { length: 255 }),
    is2FAEnabled: boolean('is_2fa_enabled').default(false),

    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .default(sql`CURRENT_TIMESTAMP`)
        .onUpdateNow()
});
