import http from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { ensureQdrantCollections } from "./config/qdrant.js";
import { connectRedis } from "./config/redis.js";
import { initializeSockets } from "./sockets/index.js";
import { startDocumentWorker } from "./jobs/documentQueue.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  logger.info("startup", "Configuration loaded", {
    telegram: {
      botToken: Boolean(env.telegramBotToken),
      webhookUrl: Boolean(env.telegramWebhookUrl)
    },
    google: {
      clientId: Boolean(env.googleClientId),
      redirectUri: Boolean(env.googleRedirectUri),
      tokenEncryptionKey: Boolean(env.googleTokenEncryptionKey)
    },
    groq: {
      apiKey: Boolean(env.groqApiKey),
      model: env.groqChatModel
    }
  });

  await connectDatabase();

  await ensureQdrantCollections().catch((error) => {
    logger.skipped("qdrant", "Qdrant setup", { reason: error.message });
  });

  await connectRedis();
  startDocumentWorker();

  const server = http.createServer(app);
  initializeSockets(server);

  server.listen(env.port, () => {
    logger.ready("server", `Backend listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error("server", "Server failed to start", { error: error.message });
  process.exit(1);
});
