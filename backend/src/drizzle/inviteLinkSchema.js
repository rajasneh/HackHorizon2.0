import { sql } from "drizzle-orm";
import { boolean, datetime, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const inviteLinks = mysqlTable("invite_links", {
    id: int("id").primaryKey().autoincrement(),
    token: varchar("token", { length: 128 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    expiresAt: datetime("expires_at").notNull(),
    used: boolean("used").default(false),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});
