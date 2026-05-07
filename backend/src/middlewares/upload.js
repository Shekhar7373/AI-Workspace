import path from "path";
import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(new ApiError(400, "Only PDF, DOCX, and TXT files are supported."));
      return;
    }
    cb(null, true);
  }
});
