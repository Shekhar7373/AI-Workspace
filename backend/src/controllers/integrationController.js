import {
  disconnectGoogleIntegration,
  getGoogleAuthUrl,
  getGoogleIntegrationStatus,
  handleGoogleOAuthCallback
} from "../services/googleOAuthService.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getGoogleStatusController = asyncHandler(async (req, res) => {
  const status = await getGoogleIntegrationStatus(req.user._id);
  res.json({ success: true, google: status });
});

export const getGoogleAuthUrlController = asyncHandler(async (req, res) => {
  const url = getGoogleAuthUrl(req.user._id);
  res.json({ success: true, url });
});

export const googleOAuthCallbackController = asyncHandler(async (req, res) => {
  await handleGoogleOAuthCallback({
    code: req.query.code,
    state: req.query.state
  });

  logger.info("google", "Redirecting after Google OAuth callback");
  res.redirect(`${env.clientUrl}/settings?google=connected`);
});

export const disconnectGoogleController = asyncHandler(async (req, res) => {
  await disconnectGoogleIntegration(req.user._id);
  res.json({ success: true, message: "Google account disconnected." });
});
