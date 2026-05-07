import http from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { ensureQdrantCollections } from "./config/qdrant.js";
import { connectRedis } from "./config/redis.js";
import { initializeSockets } from "./sockets/index.js";
import { startDocumentWorker } from "./jobs/documentQueue.js";

async function bootstrap() {
  await connectDatabase();

  await ensureQdrantCollections().catch((error) => {
    console.warn("Qdrant setup skipped:", error.message);
  });

  await connectRedis();
  startDocumentWorker();

  const server = http.createServer(app);
  initializeSockets(server);

  server.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
