import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { protect } from "../middlewares/auth.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", protect, dashboardController);
