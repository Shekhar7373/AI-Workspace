import { Router } from "express";
import {
  executeAgentToolController,
  getAgentToolsController,
  runAgentController
} from "../controllers/agentController.js";
import { protect } from "../middlewares/auth.js";

export const agentRoutes = Router();

agentRoutes.use(protect);
agentRoutes.get("/tools", getAgentToolsController);
agentRoutes.post("/run", runAgentController);
agentRoutes.post("/tools/execute", executeAgentToolController);
