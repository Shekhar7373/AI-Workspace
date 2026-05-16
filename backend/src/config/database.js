import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logger.connected("mongodb", "MongoDB", {
    database: mongoose.connection.name,
    host: mongoose.connection.host
  });
}
