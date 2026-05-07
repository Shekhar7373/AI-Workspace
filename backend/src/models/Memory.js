import mongoose from "mongoose";

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["preference", "study_habit", "weak_subject", "coding_interest", "project", "goal", "conversation", "custom"],
    default: "custom"
  },
  content: {
    type: String,
    required: true
  },
  embeddingId: {
    type: String,
    default: ""
  },
  source: {
    type: String,
    default: "manual"
  }
}, { timestamps: true });

export const Memory = mongoose.model("Memory", memorySchema);
