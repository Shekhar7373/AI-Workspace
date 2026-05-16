import crypto from "crypto";
import { env } from "../../config/env.js";
import { TelegramLink } from "../../models/TelegramLink.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { logger } from "../../utils/logger.js";

const buckets = new Map();

export function verifyTelegramWebhook(req, res, next) {
  const expected = env.telegramWebhookSecret;
  const received = String(req.headers["x-telegram-bot-api-secret-token"] || "");

  if (!expected) return next(new ApiError(500, "TELEGRAM_WEBHOOK_SECRET is not configured."));
  if (
    !received ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  ) {
    logger.warn("telegram", "Webhook verification failed", {
      ip: req.ip,
      hasSecretHeader: Boolean(received)
    });
    return next(new ApiError(401, "Invalid Telegram webhook secret."));
  }

  next();
}

export function telegramRateLimit(req, res, next) {
  const update = req.body || {};
  const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id || req.ip;
  const key = String(chatId);
  const now = Date.now();
  const windowMs = env.telegramRateLimitWindowMs;
  const max = env.telegramRateLimitMax;
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > max) {
    logger.warn("telegram", "Rate limit exceeded", { chatId: key, count: bucket.count, max });
    return next(new ApiError(429, "Telegram rate limit exceeded."));
  }
  next();
}

export const attachTelegramUser = asyncHandler(async (req, res, next) => {
  const from = req.body?.message?.from || req.body?.callback_query?.from;
  if (!from?.id) return next();

  const link = await TelegramLink.findOne({ telegramUserId: String(from.id) });
  if (link) {
    link.lastSeenAt = new Date();
    await link.save();
    req.telegramLink = link;
    req.workspaceUserId = link.userId;
  }

  next();
});
