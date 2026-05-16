import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: null
});

redis.on("connect", () => logger.connected("redis", "Redis"));
redis.on("error", (error) => {
  logger.warn("redis", "Redis unavailable", {
    reason: error.code || error.name || "connection failed"
  });
});

export function isRedisReady() {
  return redis.status === "ready";
}

export async function connectRedis() {
  if (redis.status === "ready" || redis.status === "connecting" || redis.status === "connect") return;
  try {
    await redis.connect();
  } catch (error) {
    logger.skipped("redis", "Redis setup", { reason: error.message });
  }
}
