import { asyncHandler } from "../utils/asyncHandler.js";
import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";
import { Memory } from "../models/Memory.js";
import { Chat } from "../models/Chat.js";

export const dashboardController = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [recentDocuments, pendingTasks, memoryHighlights, recentChats, taskStats] = await Promise.all([
    Document.find({ userId }).sort({ createdAt: -1 }).limit(5),
    Task.find({ userId, status: { $ne: "done" } }).sort({ deadline: 1 }).limit(8),
    Memory.find({ userId }).sort({ createdAt: -1 }).limit(5),
    Chat.find({ userId }).sort({ updatedAt: -1 }).limit(5).select("title summary updatedAt"),
    Task.aggregate([
      { $match: { userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ]);

  res.json({
    success: true,
    dashboard: {
      recentDocuments,
      pendingTasks,
      memoryHighlights,
      recentChats,
      taskStats
    }
  });
});
