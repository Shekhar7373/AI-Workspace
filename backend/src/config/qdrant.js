import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const qdrant = new QdrantClient({
  url: env.qdrantUrl,
  apiKey: env.qdrantApiKey || undefined,
  checkCompatibility: false
});

const collections = [
  "document_chunks",
  "memory_vectors",
  "conversation_vectors"
];

export async function ensureQdrantCollections() {
  const response = await fetch(`${env.qdrantUrl}/collections`).catch(() => null);
  if (!response?.ok) {
    throw new Error(`Qdrant is not reachable at ${env.qdrantUrl}`);
  }

  const existing = await qdrant.getCollections();
  const names = new Set(existing.collections.map((collection) => collection.name));

  await Promise.all(collections.map(async (name) => {
    if (names.has(name)) {
      const collection = await qdrant.getCollection(name);
      const vectors = collection.config?.params?.vectors;
      const size = vectors?.size || vectors?.default?.size;
      if (size && size !== env.hfEmbeddingDimension) {
        throw new Error(
          `Qdrant collection "${name}" uses vector size ${size}, but HF embeddings need ${env.hfEmbeddingDimension}. Delete/recreate this collection before indexing.`
        );
      }
      return;
    }
    await qdrant.createCollection(name, {
      vectors: {
        size: env.hfEmbeddingDimension,
        distance: "Cosine"
      }
    });
  }));

  logger.ready("qdrant", "Qdrant collections", {
    collections,
    dimension: env.hfEmbeddingDimension
  });
}
