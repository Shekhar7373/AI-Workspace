import { Router } from "express";
import {
  askDocumentController,
  chatController,
  searchController,
  studyPlanController,
  summaryController
} from "../controllers/aiController.js";
import { protect } from "../middlewares/auth.js";

export const aiRoutes = Router();

aiRoutes.use(protect);
aiRoutes.post("/chat", chatController);
aiRoutes.post("/ask-document", askDocumentController);
aiRoutes.post("/generate-summary", summaryController);
aiRoutes.post("/search", searchController);
aiRoutes.post("/study-plan", studyPlanController);
