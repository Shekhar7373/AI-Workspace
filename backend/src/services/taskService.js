import { Task } from "../models/Task.js";
import { groq, assertGroqKey } from "../config/groq.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export async function createTask(userId, data) {
  return Task.create({ userId, ...data });
}

export async function listTasks(userId) {
  return Task.find({ userId }).sort({ deadline: 1, createdAt: -1 });
}

export async function updateTask(userId, id, data) {
  const task = await Task.findOneAndUpdate({ _id: id, userId }, data, { new: true, runValidators: true });
  if (!task) throw new ApiError(404, "Task not found.");
  return task;
}

export async function deleteTask(userId, id) {
  const task = await Task.findOneAndDelete({ _id: id, userId });
  if (!task) throw new ApiError(404, "Task not found.");
  return task;
}

export async function generateStudyPlan({ goal, deadline, tasks = [] }) {
  assertGroqKey();
  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      { role: "system", content: "Create a realistic study plan with dates, priorities, revision slots, and progress checkpoints." },
      { role: "user", content: JSON.stringify({ goal, deadline, tasks }) }
    ]
  });
  return response.choices[0].message.content || "";
}
