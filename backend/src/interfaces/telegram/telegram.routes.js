import { Router } from "express";
import { protect } from "../../middlewares/auth.js";
import {
  createTelegramLinkCodeController,
  getTelegramLinkStatusController,
  setupTelegramWebhookController,
  telegramWebhookController,
  unlinkTelegramController
} from "./telegram.controller.js";
import {
  attachTelegramUser,
  telegramRateLimit,
  verifyTelegramWebhook
} from "./telegram.middleware.js";

export const telegramRoutes = Router();

// Public Telegram ingress. Security is handled through Telegram's secret-token
// header plus chat-level rate limiting before the update reaches app services.
telegramRoutes.post(
  "/webhook",
  verifyTelegramWebhook,
  telegramRateLimit,
  attachTelegramUser,
  telegramWebhookController
);

// Authenticated web-app helpers for linking and operational setup.
telegramRoutes.post("/link-code", protect, createTelegramLinkCodeController);
telegramRoutes.get("/status", protect, getTelegramLinkStatusController);
telegramRoutes.delete("/unlink", protect, unlinkTelegramController);
telegramRoutes.post("/setup-webhook", protect, setupTelegramWebhookController);
