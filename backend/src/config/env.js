import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_workspace",
  jwtSecret: process.env.JWT_SECRET || "dev_access_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqChatModel: process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile",
  hfEmbeddingModel: process.env.HF_EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  hfEmbeddingDimension: Number(process.env.HF_EMBEDDING_DIMENSION || 384),
  qdrantUrl: process.env.QDRANT_URL || "http://localhost:6333",
  qdrantApiKey: process.env.QDRANT_API_KEY || "",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/integrations/google/callback",
  googleTokenEncryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  telegramWebhookUrl: process.env.TELEGRAM_WEBHOOK_URL || "",
  telegramLinkCodeTtlMinutes: Number(process.env.TELEGRAM_LINK_CODE_TTL_MINUTES || 10),
  telegramRateLimitWindowMs: Number(process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS || 60000),
  telegramRateLimitMax: Number(process.env.TELEGRAM_RATE_LIMIT_MAX || 20)
};
