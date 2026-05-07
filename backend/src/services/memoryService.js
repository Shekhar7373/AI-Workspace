import { isRedisReady, redis } from "../config/redis.js";
import { Memory } from "../models/Memory.js";
import { storeMemoryVector, semanticSearch } from "./vectorService.js";

export async function getRecentMessages(userId, limit = 12) {
  if (!isRedisReady()) return [];
  const key = `session:${userId}:messages`;
  const raw = await redis.lrange(key, -limit, -1);
  return raw.map((item) => JSON.parse(item));
}

export async function appendRecentMessage(userId, message) {
  if (!isRedisReady()) return;
  const key = `session:${userId}:messages`;
  await redis.rpush(key, JSON.stringify(message));
  await redis.ltrim(key, -30, -1);
  await redis.expire(key, 60 * 60 * 12);
}

export async function createMemory({ userId, type = "custom", content, source = "manual" }) {
  const memory = await Memory.create({ userId, type, content, source });
  try {
    const embeddingId = await storeMemoryVector({ userId, memoryId: memory._id, content, type });
    memory.embeddingId = embeddingId;
    await memory.save();
  } catch (error) {
    memory.source = `${source}:vector_failed`;
    await memory.save();
  }
  return memory;
}

export async function listMemories(userId) {
  return Memory.find({ userId }).sort({ createdAt: -1 });
}

export async function findRelevantMemories(userId, query, limit = 5) {
  try {
    const results = await semanticSearch({
      collection: "memory_vectors",
      userId,
      query,
      limit
    });
    return results.map((item) => item.payload);
  } catch {
    return [];
  }
}
