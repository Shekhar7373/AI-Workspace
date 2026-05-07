import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { createTask, deleteTask, listTasks, updateTask } from "../services/taskService.js";

export const createTaskController = asyncHandler(async (req, res) => {
  if (!req.body.title) throw new ApiError(400, "Task title is required.");
  const task = await createTask(req.user._id, req.body);
  res.status(201).json({ success: true, task });
});

export const getTasksController = asyncHandler(async (req, res) => {
  const tasks = await listTasks(req.user._id);
  res.json({ success: true, tasks });
});

export const updateTaskController = asyncHandler(async (req, res) => {
  const task = await updateTask(req.user._id, req.params.id, req.body);
  res.json({ success: true, task });
});

export const deleteTaskController = asyncHandler(async (req, res) => {
  await deleteTask(req.user._id, req.params.id);
  res.json({ success: true, message: "Task deleted." });
});
