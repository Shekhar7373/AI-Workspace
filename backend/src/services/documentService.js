import fs from "fs/promises";
import { Document } from "../models/Document.js";
import { extractTextFromFile } from "./fileProcessingService.js";
import { chunkText } from "../ai/rag/chunkText.js";
import { upsertDocumentChunks, semanticSearch } from "./vectorService.js";
import { ApiError } from "../utils/apiError.js";

export async function createDocumentRecord({ userId, file, title, subject, tags }) {
  return Document.create({
    userId,
    title: title || file.originalname,
    subject: subject || "",
    tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    fileUrl: file.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    processingStatus: "pending"
  });
}

export async function processDocument(document) {
  document.processingStatus = "processing";
  await document.save();

  try {
    const text = await extractTextFromFile(document.fileUrl, document.mimeType);
    const chunks = chunkText(text, 500, 100);
    await upsertDocumentChunks({
      userId: document.userId,
      documentId: document._id,
      chunks
    });
    document.chunkCount = chunks.length;
    document.processingStatus = "completed";
    document.processingError = "";
    await document.save();
    return document;
  } catch (error) {
    document.processingStatus = "failed";
    document.processingError = error.message;
    await document.save();
    return document;
  }
}

export async function processDocumentById(documentId) {
  const document = await Document.findById(documentId);
  if (!document) throw new Error("Document not found for processing.");
  return processDocument(document);
}

export async function listDocuments(userId) {
  return Document.find({ userId }).sort({ createdAt: -1 });
}

export async function getDocumentForUser(userId, id) {
  const document = await Document.findOne({ _id: id, userId });
  if (!document) throw new ApiError(404, "Document not found.");
  return document;
}

export async function deleteDocumentForUser(userId, id) {
  const document = await getDocumentForUser(userId, id);
  await Document.deleteOne({ _id: document._id });
  await fs.unlink(document.fileUrl).catch(() => {});
  return document;
}

export async function searchDocumentChunks({ userId, query, documentId, limit = 5 }) {
  return semanticSearch({
    collection: "document_chunks",
    userId,
    query,
    limit,
    extraFilter: documentId ? { documentId } : {}
  });
}
