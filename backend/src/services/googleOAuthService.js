import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { env } from "../config/env.js";
import {
  assertGoogleOAuthConfig,
  createGoogleOAuthClient,
  googleOAuthScopes
} from "../config/google.js";
import { GoogleIntegration } from "../models/GoogleIntegration.js";
import { decryptSecret, encryptSecret } from "../utils/encryption.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

function signOAuthState(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: "10m" });
}

function verifyOAuthState(state) {
  if (!state) throw new ApiError(400, "Google OAuth state is missing.");
  try {
    return jwt.verify(state, env.jwtSecret);
  } catch {
    throw new ApiError(400, "Google OAuth state is invalid or expired.");
  }
}

export function getGoogleAuthUrl(userId) {
  assertGoogleOAuthConfig();
  const oauth2Client = createGoogleOAuthClient();
  logger.info("google", "Generated Google OAuth URL", { userId: userId.toString() });

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: googleOAuthScopes,
    state: signOAuthState(userId)
  });
}

async function getGoogleEmail(oauth2Client) {
  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const { data } = await oauth2.userinfo.get();
  return data.email || "";
}

export async function handleGoogleOAuthCallback({ code, state }) {
  assertGoogleOAuthConfig();
  if (!code) throw new ApiError(400, "Google OAuth code is missing.");

  const decoded = verifyOAuthState(state);
  logger.info("google", "Handling Google OAuth callback", { userId: decoded.userId });
  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const existing = await GoogleIntegration.findOne({ userId: decoded.userId }).select("+refreshToken");
  const refreshToken = tokens.refresh_token || (existing?.refreshToken ? decryptSecret(existing.refreshToken) : "");
  if (!refreshToken) throw new ApiError(400, "Google did not return a refresh token. Revoke access and connect again.");

  const googleEmail = await getGoogleEmail(oauth2Client).catch(() => existing?.googleEmail || "");

  const integration = await GoogleIntegration.findOneAndUpdate(
    { userId: decoded.userId },
    {
      googleEmail,
      accessToken: encryptSecret(tokens.access_token || ""),
      refreshToken: encryptSecret(refreshToken),
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scopes: googleOAuthScopes,
      connectedAt: existing?.connectedAt || new Date(),
      lastRefreshedAt: new Date()
    },
    { new: true, upsert: true, runValidators: true }
  );

  logger.connected("google", "Google integration", {
    userId: decoded.userId,
    googleEmail
  });

  return integration;
}

export async function getGoogleIntegrationStatus(userId) {
  const integration = await GoogleIntegration.findOne({ userId });
  return {
    connected: Boolean(integration),
    googleEmail: integration?.googleEmail || "",
    scopes: integration?.scopes || [],
    connectedAt: integration?.connectedAt,
    expiryDate: integration?.expiryDate
  };
}

export async function disconnectGoogleIntegration(userId) {
  await GoogleIntegration.deleteOne({ userId });
  logger.info("google", "Google integration disconnected", { userId: userId.toString() });
}

export async function markGoogleIntegrationInvalid(userId, reason = "invalid_grant") {
  await GoogleIntegration.deleteOne({ userId });
  logger.warn("google", "Google integration invalidated", {
    userId: userId.toString(),
    reason
  });
}

export async function getAuthorizedGoogleClient(userId) {
  assertGoogleOAuthConfig();
  const integration = await GoogleIntegration.findOne({ userId }).select("+accessToken +refreshToken");
  if (!integration) throw new ApiError(409, "Google account is not connected.");

  const oauth2Client = createGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: decryptSecret(integration.accessToken),
    refresh_token: decryptSecret(integration.refreshToken),
    expiry_date: integration.expiryDate?.getTime()
  });

  oauth2Client.on("tokens", async (tokens) => {
    const patch = { lastRefreshedAt: new Date() };
    if (tokens.access_token) patch.accessToken = encryptSecret(tokens.access_token);
    if (tokens.refresh_token) patch.refreshToken = encryptSecret(tokens.refresh_token);
    if (tokens.expiry_date) patch.expiryDate = new Date(tokens.expiry_date);
    await GoogleIntegration.updateOne({ userId }, patch).catch(() => {});
    logger.info("google", "Google tokens refreshed", {
      userId: userId.toString(),
      accessTokenUpdated: Boolean(tokens.access_token),
      refreshTokenUpdated: Boolean(tokens.refresh_token)
    });
  });

  return oauth2Client;
}
