import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    default: "",
    trim: true
  },
  tags: [{ type: String, trim: true }],
  fileUrl: {
    type: String,
    required: true
  },
  originalName: String,
  mimeType: String,
  chunkCount: {
    type: Number,
    default: 0
  },
  processingStatus: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
  },
  processingError: String
}, { timestamps: true });

export const Document = mongoose.model("Document", documentSchema);
