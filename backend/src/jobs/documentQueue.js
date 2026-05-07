import { Queue, Worker } from "bullmq";
import { isRedisReady, redis } from "../config/redis.js";
import { processDocumentById } from "../services/documentService.js";

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
    console.warn("Document worker skipped: Redis is not available.");
    return null;
  }

  const worker = new Worker("document-processing", async (job) => {
    await processDocumentById(job.data.documentId);
  }, { connection: redis });

  worker.on("completed", (job) => {
    console.log(`Document job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.warn(`Document job ${job?.id} failed:`, error.message);
  });

  return worker;
}
