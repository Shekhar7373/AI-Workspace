import { google } from "googleapis";
import { env } from "./env.js";

export const googleOAuthScopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar.events"
];

export function assertGoogleOAuthConfig() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    const error = new Error("Google OAuth credentials are required.");
    error.statusCode = 503;
    throw error;
  }

  if (!env.googleTokenEncryptionKey) {
    const error = new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is required to store Google tokens.");
    error.statusCode = 503;
    throw error;
  }
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}
