import { Router } from "express";
import {
  disconnectGoogleController,
  getGoogleAuthUrlController,
  getGoogleStatusController,
  googleOAuthCallbackController
} from "../controllers/integrationController.js";
import { protect } from "../middlewares/auth.js";

export const integrationRoutes = Router();

integrationRoutes.get("/google/callback", googleOAuthCallbackController);
integrationRoutes.get("/google/status", protect, getGoogleStatusController);
integrationRoutes.get("/google/auth-url", protect, getGoogleAuthUrlController);
integrationRoutes.delete("/google", protect, disconnectGoogleController);
