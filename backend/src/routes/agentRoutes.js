import { Router } from "express";
import { runAgentController } from "../controllers/agentController.js";
import { protect } from "../middlewares/auth.js";

export const agentRoutes = Router();

agentRoutes.use(protect);
agentRoutes.post("/run", runAgentController);
