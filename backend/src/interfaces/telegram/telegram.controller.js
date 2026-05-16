import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createTelegramLinkCode,
  getTelegramLinkStatus,
  processTelegramUpdate,
  setupTelegramWebhook,
  unlinkTelegramUser
} from "./telegram.service.js";

export const telegramWebhookController = asyncHandler(async (req, res) => {
  // Telegram expects a quick 200 response. All business work is delegated to
  // the Telegram service, which in turn calls the existing workspace services.
  const result = await processTelegramUpdate(req.body);
  res.json({ success: true, result });
});

export const createTelegramLinkCodeController = asyncHandler(async (req, res) => {
  const link = await createTelegramLinkCode(req.user._id);
  res.json({ success: true, link });
});

export const getTelegramLinkStatusController = asyncHandler(async (req, res) => {
  const status = await getTelegramLinkStatus(req.user._id);
  res.json({ success: true, ...status });
});

export const unlinkTelegramController = asyncHandler(async (req, res) => {
  const status = await unlinkTelegramUser(req.user._id);
  res.json({ success: true, ...status });
});

export const setupTelegramWebhookController = asyncHandler(async (req, res) => {
  const result = await setupTelegramWebhook();
  res.json({ success: true, result });
});
