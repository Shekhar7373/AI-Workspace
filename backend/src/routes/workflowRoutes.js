import { Router } from "express";
import { suggestLocalWorkflowController } from "../controllers/workflowController.js";
import { protect } from "../middlewares/auth.js";

export const workflowRoutes = Router();

workflowRoutes.use(protect);
workflowRoutes.post("/suggest", suggestLocalWorkflowController);
