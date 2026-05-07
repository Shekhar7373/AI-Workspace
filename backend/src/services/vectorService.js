import { qdrant } from "../config/qdrant.js";
import { createEmbedding, createEmbeddings, vectorId } from "../ai/embeddings/embeddingService.js";

export async function upsertDocumentChunks({ userId, documentId, chunks }) {
  const embeddings = await createEmbeddings(chunks);
  const points = chunks.map((chunk, index) => ({
    id: vectorId(),
    vector: embeddings[index],
    payload: {
      userId: userId.toString(),
      documentId: documentId.toString(),
      chunkIndex: index,
      text: chunk
    }
  }));

  if (points.length) {
    await qdrant.upsert("document_chunks", { wait: true, points });
  }

  return points;
}

export async function storeMemoryVector({ userId, memoryId, content, type }) {
  const embedding = await createEmbedding(content);
  const id = vectorId();
  await qdrant.upsert("memory_vectors", {
    wait: true,
    points: [{
      id,
      vector: embedding,
      payload: {
        userId: userId.toString(),
        memoryId: memoryId.toString(),
        type,
        text: content
      }
    }]
  });
  return id;
}

export async function storeConversationVector({ userId, chatId, content }) {
  const embedding = await createEmbedding(content);
  const id = vectorId();
  await qdrant.upsert("conversation_vectors", {
    wait: true,
    points: [{
      id,
      vector: embedding,
      payload: {
        userId: userId.toString(),
        chatId: chatId.toString(),
        text: content
      }
    }]
  });
  return id;
}

export async function semanticSearch({ collection, userId, query, limit = 5, extraFilter = {} }) {
  const vector = await createEmbedding(query);
  return qdrant.search(collection, {
    vector,
    limit,
    with_payload: true,
    filter: {
      must: [
        { key: "userId", match: { value: userId.toString() } },
        ...Object.entries(extraFilter).map(([key, value]) => ({ key, match: { value: value.toString() } }))
      ]
    }
  });
}
