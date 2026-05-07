import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { uploadDocument } from "../middlewares/upload.js";
import {
  deleteDocumentController,
  getDocumentController,
  getDocumentsController,
  uploadDocumentController
} from "../controllers/documentController.js";

export const documentRoutes = Router();

documentRoutes.use(protect);
documentRoutes.post("/upload", uploadDocument.single("file"), uploadDocumentController);
documentRoutes.get("/", getDocumentsController);
documentRoutes.get("/:id", getDocumentController);
documentRoutes.delete("/:id", deleteDocumentController);
