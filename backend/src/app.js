import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import { authRoutes } from "./routes/authRoutes.js";
import { documentRoutes } from "./routes/documentRoutes.js";
import { aiRoutes } from "./routes/aiRoutes.js";
import { memoryRoutes } from "./routes/memoryRoutes.js";
import { taskRoutes } from "./routes/taskRoutes.js";
import { agentRoutes } from "./routes/agentRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Workspace backend is running.",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);
