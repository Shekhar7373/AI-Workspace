import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getTasksController,
  updateTaskController
} from "../controllers/taskController.js";
import { protect } from "../middlewares/auth.js";

export const taskRoutes = Router();

taskRoutes.use(protect);
taskRoutes.post("/", createTaskController);
taskRoutes.get("/", getTasksController);
taskRoutes.put("/:id", updateTaskController);
taskRoutes.delete("/:id", deleteTaskController);
