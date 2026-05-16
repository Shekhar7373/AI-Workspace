import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

function encryptionKey() {
  if (!env.googleTokenEncryptionKey) {
    throw new ApiError(503, "GOOGLE_TOKEN_ENCRYPTION_KEY is required.");
  }

  return crypto.createHash("sha256").update(env.googleTokenEncryptionKey).digest();
}

export function encryptSecret(value) {
  if (!value) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(value) {
  if (!value) return "";
  const [ivRaw, tagRaw, encryptedRaw] = String(value).split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new ApiError(500, "Encrypted secret format is invalid.");

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}
