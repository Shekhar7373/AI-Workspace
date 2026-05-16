import { Queue, Worker } from "bullmq";
import { isRedisReady, redis } from "../config/redis.js";
import { processDocumentById } from "../services/documentService.js";
import { logger } from "../utils/logger.js";

let documentQueue;

function getDocumentQueue() {
  if (!documentQueue) {
    documentQueue = new Queue("document-processing", {
      connection: redis
    });
  }
  return documentQueue;
}

export async function addDocumentProcessingJob(documentId) {
  if (!isRedisReady()) {
    throw new Error("Redis is not ready for document queue.");
  }

  return getDocumentQueue().add("process-document", { documentId: documentId.toString() }, {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false
  });
}

export function startDocumentWorker() {
  if (!isRedisReady()) {
    logger.skipped("documents", "Document worker", { reason: "Redis is not available" });
    return null;
  }

  const worker = new Worker("document-processing", async (job) => {
    logger.info("documents", "Processing document job", {
      jobId: job.id,
      documentId: job.data.documentId
    });
    await processDocumentById(job.data.documentId);
  }, { connection: redis });

  worker.on("completed", (job) => {
    logger.info("documents", "Document job completed", { jobId: job.id });
  });

  worker.on("failed", (job, error) => {
    logger.warn("documents", "Document job failed", {
      jobId: job?.id,
      reason: error.message
    });
  });

  logger.ready("documents", "Document worker");
  return worker;
}
