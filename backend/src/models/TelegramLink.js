import mongoose from "mongoose";

const telegramLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  telegramUserId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  chatId: {
    type: String,
    index: true
  },
  username: String,
  firstName: String,
  lastName: String,
  linkCodeHash: {
    type: String,
    default: ""
  },
  linkCodeExpiresAt: Date,
  linkedAt: Date,
  lastSeenAt: Date
}, { timestamps: true });

export const TelegramLink = mongoose.model("TelegramLink", telegramLinkSchema);
