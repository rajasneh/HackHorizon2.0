import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost", 
  port: process.env.REDIS_PORT || 6379, 
  username: process.env.REDIS_USERNAME || "", 
  password: process.env.REDIS_PASSWORD || "",
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("🟢 Redis Connected Successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});