import Groq from "groq-sdk";
import { env } from "./env.js";

export const groq = new Groq({
  apiKey: env.groqApiKey || "missing-key"
});

export function assertGroqKey() {
  if (!env.groqApiKey) {
    const error = new Error("GROQ_API_KEY is required for AI chat and reasoning features.");
    error.statusCode = 503;
    throw error;
  }
}
