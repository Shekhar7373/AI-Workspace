import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { chat, chatWithTools, summarize } from "../services/aiService.js";
import { searchDocumentChunks } from "../services/documentService.js";
import { generateStudyPlan } from "../services/taskService.js";

export const chatController = asyncHandler(async (req, res) => {
  const { message, chatId, documentId, mode } = req.body;
  if (!message) throw new ApiError(400, "Message is required.");
  const result = await chat({ userId: req.user._id, message, chatId, documentId, mode });
  res.json({ success: true, ...result });
});

export const chatWithToolsController = asyncHandler(async (req, res) => {
  const { message, chatId, documentId, mode } = req.body;
  if (!message) throw new ApiError(400, "Message is required.");
  const result = await chatWithTools({ userId: req.user._id, message, chatId, documentId, mode });
  res.json({ success: true, ...result });
});

export const askDocumentController = asyncHandler(async (req, res) => {
  const { question, documentId } = req.body;
  if (!question) throw new ApiError(400, "Question is required.");
  const result = await chat({
    userId: req.user._id,
    message: question,
    documentId,
    mode: "workspace"
  });
  res.json({ success: true, ...result });
});

export const summaryController = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new ApiError(400, "Text is required.");
  const summary = await summarize({ userId: req.user._id, text });
  res.json({ success: true, summary });
});

export const searchController = asyncHandler(async (req, res) => {
  const { query, documentId, limit } = req.body;
  if (!query) throw new ApiError(400, "Search query is required.");
  const results = await searchDocumentChunks({
    userId: req.user._id,
    query,
    documentId,
    limit: Number(limit) || 8
  });
  res.json({ success: true, results });
});

export const studyPlanController = asyncHandler(async (req, res) => {
  const plan = await generateStudyPlan(req.body);
  res.json({ success: true, plan });
});
