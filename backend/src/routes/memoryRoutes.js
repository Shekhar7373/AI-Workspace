import { Router } from "express";
import { getMemoryController, storeMemoryController } from "../controllers/memoryController.js";
import { protect } from "../middlewares/auth.js";

export const memoryRoutes = Router();

memoryRoutes.use(protect);
memoryRoutes.get("/", getMemoryController);
memoryRoutes.post("/store", storeMemoryController);
