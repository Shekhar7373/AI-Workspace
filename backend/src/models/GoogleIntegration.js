import mongoose from "mongoose";

const googleIntegrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  googleEmail: {
    type: String,
    default: ""
  },
  accessToken: {
    type: String,
    default: "",
    select: false
  },
  refreshToken: {
    type: String,
    default: "",
    select: false
  },
  expiryDate: Date,
  scopes: [{ type: String }],
  connectedAt: Date,
  lastRefreshedAt: Date
}, { timestamps: true });

export const GoogleIntegration = mongoose.model("GoogleIntegration", googleIntegrationSchema);
