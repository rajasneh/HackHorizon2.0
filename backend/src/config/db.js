import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log("🟢 MySQL Database connected successfully");
    connection.release();
  })
  .catch(err => {
    console.error("❌ MySQL Database connection failed:", err);
  });

export const db = drizzle(pool);
