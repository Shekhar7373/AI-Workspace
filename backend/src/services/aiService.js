import { groq, assertGroqKey } from "../config/groq.js";
import { env } from "../config/env.js";
import { Chat } from "../models/Chat.js";
import { workspaceSystemPrompt, codingSystemPrompt } from "../ai/prompts/systemPrompts.js";
import { executeToolCalls, getAvailableToolsPrompt } from "../ai/tools/toolExecutor.js";
import { extractJsonObject } from "../ai/utils/json.js";
import { findRelevantMemories } from "./memoryService.js";
import { searchDocumentChunks } from "./documentService.js";
import { storeConversationVector } from "./vectorService.js";

function contextBlock(title, items) {
  if (!items.length) return "";
  return `\n\n${title}:\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}

async function buildContext(userId, prompt, documentId) {
  const [memories, chunks] = await Promise.all([
    findRelevantMemories(userId, prompt).catch(() => []),
    searchDocumentChunks({ userId, query: prompt, documentId, limit: 5 }).catch(() => [])
  ]);

  const memoryText = memories.map((memory) => memory.text || memory.content).filter(Boolean);
  const chunkText = chunks.map((chunk) => chunk.payload?.text).filter(Boolean);

  return [
    contextBlock("Relevant memories", memoryText),
    contextBlock("Relevant document chunks", chunkText)
  ].join("");
}

export async function chat({ userId, message, chatId, documentId, mode = "workspace" }) {
  assertGroqKey();
  const chatDoc = chatId
    ? await Chat.findOne({ _id: chatId, userId })
    : await Chat.create({ userId, title: message.slice(0, 70) || "New conversation" });

  const context = await buildContext(userId, message, documentId);
  const systemPrompt = mode === "coding" ? codingSystemPrompt : workspaceSystemPrompt;

  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      { role: "system", content: `${systemPrompt}${context}` },
      ...chatDoc.messages.slice(-8).map(({ role, content }) => ({ role, content })),
      { role: "user", content: message }
    ]
  });

  const answer = response.choices[0].message.content || "";
  chatDoc.messages.push({ role: "user", content: message });
  chatDoc.messages.push({ role: "assistant", content: answer });
  await chatDoc.save();

  await storeConversationVector({ userId, chatId: chatDoc._id, content: `${message}\n${answer}` }).catch(() => {});

  return { chatId: chatDoc._id, answer };
}

export async function chatWithTools({ userId, message, chatId, documentId, mode = "workspace" }) {
  assertGroqKey();
  const chatDoc = chatId
    ? await Chat.findOne({ _id: chatId, userId })
    : await Chat.create({ userId, title: message.slice(0, 70) || "New conversation" });

  const context = await buildContext(userId, message, documentId);
  const systemPrompt = mode === "coding" ? codingSystemPrompt : workspaceSystemPrompt;
  const toolPrompt = mode === "workspace"
    ? `\n\nYou can use tools for workspace actions. Available tools:\n${getAvailableToolsPrompt()}

When a tool is useful, respond as JSON only:
{
  "answer": "short user-facing answer explaining what you can do",
  "toolCalls": [
    { "tool": "tool_name", "arguments": { } }
  ]
}

Use tools for requests to send emails, draft emails, read emails, create tasks, save memory, or search documents.
Write actions are approval-gated, so propose them instead of claiming they are impossible.
If no tool is needed, respond normally.`
    : "";

  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      { role: "system", content: `${systemPrompt}${context}${toolPrompt}` },
      ...chatDoc.messages.slice(-8).map(({ role, content }) => ({ role, content })),
      { role: "user", content: message }
    ]
  });

  const rawAnswer = response.choices[0].message.content || "";
  const parsed = mode === "workspace" ? extractJsonObject(rawAnswer) : null;
  const answer = parsed?.answer || rawAnswer;
  const toolCalls = Array.isArray(parsed?.toolCalls) ? parsed.toolCalls : [];
  const toolResults = mode === "workspace"
    ? await executeToolCalls({
        userId,
        toolCalls,
        requireApproval: true,
        maxToolCalls: 5
      }).catch((error) => [{ error: error.message }])
    : [];

  chatDoc.messages.push({ role: "user", content: message });
  chatDoc.messages.push({ role: "assistant", content: answer });
  await chatDoc.save();

  await storeConversationVector({ userId, chatId: chatDoc._id, content: `${message}\n${answer}` }).catch(() => {});

  return {
    chatId: chatDoc._id,
    answer,
    toolCalls,
    toolResults,
    pendingApproval: toolResults.filter((result) => result.approvalRequired && result.skipped)
  };
}

export async function streamChat({ userId, message, chatId, documentId, mode = "workspace", onToken }) {
  assertGroqKey();
  const chatDoc = chatId
    ? await Chat.findOne({ _id: chatId, userId })
    : await Chat.create({ userId, title: message.slice(0, 70) || "New conversation" });

  const context = await buildContext(userId, message, documentId);
  const systemPrompt = mode === "coding" ? codingSystemPrompt : workspaceSystemPrompt;
  const stream = await groq.chat.completions.create({
    model: env.groqChatModel,
    stream: true,
    messages: [
      { role: "system", content: `${systemPrompt}${context}` },
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
