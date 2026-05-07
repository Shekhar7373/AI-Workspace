import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { corsOptions } from "../config/cors.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { streamChat } from "../services/aiService.js";

export function initializeSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: corsOptions
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Socket auth token missing."));
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Socket user not found."));
      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id}`);
    socket.emit("connected", { userId: socket.user._id });

    socket.on("ai:chat", async (payload = {}) => {
      const requestId = payload.requestId || Date.now().toString();
      try {
        if (!payload.message) {
          socket.emit("ai:error", { requestId, message: "Message is required." });
          return;
        }

        const result = await streamChat({
          userId: socket.user._id,
          message: payload.message,
          chatId: payload.chatId,
          documentId: payload.documentId,
          mode: payload.mode,
          onToken: (token) => socket.emit("ai:token", { requestId, token })
        });

        socket.emit("ai:done", { requestId, chatId: result.chatId, answer: result.answer });
      } catch (error) {
        socket.emit("ai:error", { requestId, message: error.message });
      }
    });
  });

  return io;
}
