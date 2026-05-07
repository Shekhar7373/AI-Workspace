import { groq, assertGroqKey } from "../config/groq.js";
import { env } from "../config/env.js";
import { Chat } from "../models/Chat.js";
import { workspaceSystemPrompt, codingSystemPrompt } from "../ai/prompts/systemPrompts.js";
import { appendRecentMessage, findRelevantMemories, getRecentMessages } from "./memoryService.js";
import { searchDocumentChunks } from "./documentService.js";
import { storeConversationVector } from "./vectorService.js";

function contextBlock(title, items) {
  if (!items.length) return "";
  return `\n\n${title}:\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}

async function buildContext(userId, prompt, documentId) {
  const [recentMessages, memories, chunks] = await Promise.all([
    getRecentMessages(userId).catch(() => []),
    findRelevantMemories(userId, prompt).catch(() => []),
    searchDocumentChunks({ userId, query: prompt, documentId, limit: 5 }).catch(() => [])
  ]);

  const memoryText = memories.map((memory) => memory.text || memory.content).filter(Boolean);
  const chunkText = chunks.map((chunk) => chunk.payload?.text).filter(Boolean);

  return {
    recentMessages,
    context: [
      contextBlock("Relevant memories", memoryText),
      contextBlock("Relevant document chunks", chunkText)
    ].join("")
  };
}

export async function chat({ userId, message, chatId, documentId, mode = "workspace" }) {
  assertGroqKey();
  const chatDoc = chatId
    ? await Chat.findOne({ _id: chatId, userId })
    : await Chat.create({ userId, title: message.slice(0, 70) || "New conversation" });

  const { recentMessages, context } = await buildContext(userId, message, documentId);
  const systemPrompt = mode === "coding" ? codingSystemPrompt : workspaceSystemPrompt;

  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      { role: "system", content: `${systemPrompt}${context}` },
      ...recentMessages,
      ...chatDoc.messages.slice(-8).map(({ role, content }) => ({ role, content })),
      { role: "user", content: message }
    ]
  });

  const answer = response.choices[0].message.content || "";
  chatDoc.messages.push({ role: "user", content: message });
  chatDoc.messages.push({ role: "assistant", content: answer });
  await chatDoc.save();

  await appendRecentMessage(userId, { role: "user", content: message }).catch(() => {});
  await appendRecentMessage(userId, { role: "assistant", content: answer }).catch(() => {});
  await storeConversationVector({ userId, chatId: chatDoc._id, content: `${message}\n${answer}` }).catch(() => {});

  return { chatId: chatDoc._id, answer };
}

export async function streamChat({ userId, message, chatId, documentId, mode = "workspace", onToken }) {
  assertGroqKey();
  const chatDoc = chatId
    ? await Chat.findOne({ _id: chatId, userId })
    : await Chat.create({ userId, title: message.slice(0, 70) || "New conversation" });

  const { recentMessages, context } = await buildContext(userId, message, documentId);
  const systemPrompt = mode === "coding" ? codingSystemPrompt : workspaceSystemPrompt;
  const stream = await groq.chat.completions.create({
    model: env.groqChatModel,
    stream: true,
    messages: [
      { role: "system", content: `${systemPrompt}${context}` },
      ...recentMessages,
      ...chatDoc.messages.slice(-8).map(({ role, content }) => ({ role, content })),
      { role: "user", content: message }
    ]
  });

  let answer = "";
  for await (const part of stream) {
    const token = part.choices[0]?.delta?.content || "";
    if (!token) continue;
    answer += token;
    onToken(token);
  }

  chatDoc.messages.push({ role: "user", content: message });
  chatDoc.messages.push({ role: "assistant", content: answer });
  await chatDoc.save();
  await appendRecentMessage(userId, { role: "user", content: message }).catch(() => {});
  await appendRecentMessage(userId, { role: "assistant", content: answer }).catch(() => {});
  await storeConversationVector({ userId, chatId: chatDoc._id, content: `${message}\n${answer}` }).catch(() => {});
  return { chatId: chatDoc._id, answer };
}

export async function summarize({ userId, text }) {
  assertGroqKey();
  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      { role: "system", content: "Summarize the content into clear study notes with key points and action items." },
      { role: "user", content: text }
    ]
  });
  return response.choices[0].message.content || "";
}
