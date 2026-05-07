import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: null
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (error) => {
  console.warn("Redis unavailable:", error.code || error.name || "connection failed");
});

export function isRedisReady() {
  return redis.status === "ready";
}

export async function connectRedis() {
  if (redis.status === "ready" || redis.status === "connecting" || redis.status === "connect") return;
  try {
    await redis.connect();
  } catch (error) {
    console.warn("Redis setup skipped:", error.message);
  }
}
