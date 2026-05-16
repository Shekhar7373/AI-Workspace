import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { createMemory, deleteMemory, listMemories } from "../services/memoryService.js";

export const getMemoryController = asyncHandler(async (req, res) => {
  const memories = await listMemories(req.user._id);
  res.json({ success: true, memories });
});

export const storeMemoryController = asyncHandler(async (req, res) => {
  const { type, content, source } = req.body;
  if (!content) throw new ApiError(400, "Memory content is required.");
  const memory = await createMemory({ userId: req.user._id, type, content, source });
  res.status(201).json({ success: true, memory });
});

export const deleteMemoryController = asyncHandler(async (req, res) => {
  await deleteMemory(req.user._id, req.params.id);
  res.json({ success: true, message: "Memory deleted." });
});
