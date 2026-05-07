import { Router } from "express";
import { login, logout, profile, refresh, register } from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", protect, logout);
authRoutes.get("/profile", protect, profile);
