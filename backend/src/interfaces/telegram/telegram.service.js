import crypto from "crypto";
import { env } from "../../config/env.js";
import { chat } from "../../services/aiService.js";
import { sendGmailEmail } from "../../services/gmailService.js";
import { createMemory, findRelevantMemories, listMemories } from "../../services/memoryService.js";
import { searchDocumentChunks } from "../../services/documentService.js";
import { createTask, listTasks } from "../../services/taskService.js";
import { TelegramLink } from "../../models/TelegramLink.js";
import { ApiError } from "../../utils/apiError.js";
import { logger } from "../../utils/logger.js";
import { parseTelegramCommand } from "./telegram.parser.js";

const maxTelegramMessageLength = 3900;
const telegramSearchScoreThreshold = 0.2;

function assertTelegramConfig() {
  if (!env.telegramBotToken) throw new ApiError(500, "TELEGRAM_BOT_TOKEN is not configured.");
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code).trim().toUpperCase()).digest("hex");
}

function generateLinkCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function telegramApiUrl(method) {
  return `https://api.telegram.org/bot${env.telegramBotToken}/${method}`;
}

function hasUsableWebhookUrl() {
  return Boolean(env.telegramWebhookUrl)
    && /^https:\/\//i.test(env.telegramWebhookUrl)
    && !env.telegramWebhookUrl.includes("your-ngrok-domain");
}

async function telegramRequest(method, body) {
  assertTelegramConfig();
  const response = await fetch(telegramApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new ApiError(response.status || 502, data.description || `Telegram ${method} failed.`);
  }
  return data.result;
}

function splitMessage(text) {
  const chunks = [];
  let remaining = String(text || "");
  while (remaining.length > maxTelegramMessageLength) {
    chunks.push(remaining.slice(0, maxTelegramMessageLength));
    remaining = remaining.slice(maxTelegramMessageLength);
  }
  chunks.push(remaining || "Done.");
  return chunks;
}

export async function sendTelegramMessage(chatId, text, options = {}) {
  const messages = splitMessage(text);
  const sent = [];
  for (const chunk of messages) {
    const payload = {
      chat_id: chatId,
      text: chunk,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...options
    };

    try {
      sent.push(await telegramRequest("sendMessage", payload));
    } catch (error) {
      // Telegram rejects malformed HTML entities. Retry as plain text so the
      // bot still responds even when AI output contains unexpected markup.
      if (!String(error.message || "").toLowerCase().includes("parse")) throw error;
      const { parse_mode, ...plainPayload } = payload;
      sent.push(await telegramRequest("sendMessage", plainPayload));
    }
  }
  return sent;
}

export async function sendTelegramTyping(chatId) {
  return telegramRequest("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => null);
}

export async function createTelegramLinkCode(userId) {
  const code = generateLinkCode();
  const expiresAt = new Date(Date.now() + env.telegramLinkCodeTtlMinutes * 60 * 1000);

  await TelegramLink.findOneAndUpdate(
    { userId },
    {
      userId,
      linkCodeHash: hashCode(code),
      linkCodeExpiresAt: expiresAt
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.info("telegram", "Telegram link code generated", {
    userId: userId.toString(),
    expiresAt
  });

  return {
    code,
    expiresAt,
    instructions: `Open your Telegram bot and send /link ${code}`
  };
}

export async function getTelegramLinkStatus(userId) {
  const link = await TelegramLink.findOne({ userId }).select("-linkCodeHash");
  return {
    linked: Boolean(link?.telegramUserId),
    configured: {
      botToken: Boolean(env.telegramBotToken),
      webhookSecret: Boolean(env.telegramWebhookSecret),
      webhookUrl: hasUsableWebhookUrl(),
      webhookUrlValue: env.telegramWebhookUrl
    },
    link
  };
}

export async function unlinkTelegramUser(userId) {
  await TelegramLink.deleteOne({ userId });
  logger.info("telegram", "Telegram account unlinked", { userId: userId.toString() });
  return { linked: false };
}

export async function setupTelegramWebhook() {
  if (!hasUsableWebhookUrl()) {
    throw new ApiError(400, "TELEGRAM_WEBHOOK_URL must be a real HTTPS ngrok/domain URL, not the placeholder value.");
  }
  if (!env.telegramWebhookSecret) throw new ApiError(400, "TELEGRAM_WEBHOOK_SECRET is required.");

  const result = await telegramRequest("setWebhook", {
    url: env.telegramWebhookUrl,
    secret_token: env.telegramWebhookSecret,
    allowed_updates: ["message", "callback_query"]
  });

  logger.connected("telegram", "Telegram webhook", {
    url: env.telegramWebhookUrl
  });

  return result;
}

async function linkTelegramAccount({ code, from, chatId }) {
  if (!code) return "Send your link code like this: /link ABC123";

  const link = await TelegramLink.findOne({
    linkCodeHash: hashCode(code),
    linkCodeExpiresAt: { $gt: new Date() }
  });

  if (!link) return "That link code is invalid or expired. Generate a new code from the web app settings.";

  // A Telegram account can only point to one workspace user. Re-linking moves
  // the external interface without touching the user's workspace data.
  await TelegramLink.updateMany(
    { telegramUserId: String(from.id), _id: { $ne: link._id } },
    {
      $unset: {
        telegramUserId: "",
        chatId: "",
        username: "",
        firstName: "",
        lastName: "",
        linkedAt: ""
      }
    }
  );

  link.telegramUserId = String(from.id);
  link.chatId = String(chatId);
  link.username = from.username || "";
  link.firstName = from.first_name || "";
  link.lastName = from.last_name || "";
  link.linkedAt = new Date();
  link.lastSeenAt = new Date();
  link.linkCodeHash = "";
  link.linkCodeExpiresAt = undefined;
  await link.save();

  logger.connected("telegram", "Telegram user", {
    userId: link.userId.toString(),
    telegramUserId: String(from.id),
    chatId: String(chatId),
    username: from.username || ""
  });

  await createMemory({
    userId: link.userId,
    type: "preference",
    content: "User linked Telegram as an external AI Workspace interface.",
    source: "telegram"
  }).catch(() => null);

  return "Telegram is linked to your AI Workspace. Send /help to see what I can do.";
}

function helpText() {
  return [
    "<b>AI Digital Assistant</b>",
    "You can chat with me directly, like ChatGPT.",
    "",
    "<b>Ask AI</b>",
    "What is SQL?",
    "/ask Explain DBMS normalization",
    "/chat Give me a 5-point study plan",
    "",
    "<b>Workspace</b>",
    "/tasks - show tasks",
    "/task title: DBMS revision deadline: 2026-05-20 priority: high",
    "/remind me to revise OS tomorrow at 10pm",
    "/search TCP congestion control - search uploaded documents",
    "/memory DBMS exam - search saved memories",
    "",
    "<b>Coding</b>",
    "/code explain this C program...",
    "/code debug this JavaScript error...",
    "",
    "<b>Email</b>",
    "/mail to: person@email.com subject: Hello body: Message text",
    "",
    "<b>Account</b>",
    "/link CODE - connect this Telegram account",
    "",
    "Tip: If your message is not a command, I answer it as an AI chat question."
  ].join("\n");
}

function formatTask(task) {
  const deadline = task.deadline
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(task.deadline))
    : "No deadline";
  return `- <b>${escapeHtml(task.title)}</b>\n  ${escapeHtml(task.status)} | ${escapeHtml(task.priority)} | ${deadline}`;
}

function formatSearchResults(results) {
  if (!results.length) return "No matching document chunks found.";
  return results.map((item, index) => {
    const text = escapeHtml((item.payload?.text || "").slice(0, 700));
    const score = typeof item.score === "number" ? `score ${item.score.toFixed(2)}` : "match";
    return `<b>${index + 1}. ${score}</b>\n${text}`;
  }).join("\n\n");
}

function prepareTelegramSearchResults(results) {
  const seen = new Set();
  return results
    .filter((item) => typeof item.score !== "number" || item.score >= telegramSearchScoreThreshold)
    .filter((item) => {
      const text = String(item.payload?.text || "").trim().toLowerCase();
      if (!text || seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .slice(0, 5);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function markdownToTelegramHtml(value = "") {
  return escapeHtml(value)
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, "<pre>$1</pre>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");
}

function normalizeTaskInput(task, fallbackTitle = "Telegram reminder") {
  const deadline = task.deadline ? new Date(task.deadline) : undefined;
  return {
    title: task.title || fallbackTitle,
    description: task.description || "Created from Telegram.",
    priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
    status: "todo",
    deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : undefined
  };
}

async function requireLinkedUser({ command, link, chatId }) {
  if (command.intent === "start") {
    return "Welcome to AI Workspace on Telegram. Link your account from the web app, then send /link CODE here.";
  }
  if (command.intent === "help") return helpText();
  if (command.intent === "link") return null;
  if (!link?.userId) {
    await sendTelegramMessage(chatId, "Please link your AI Workspace account first. Generate a code in the web app, then send /link CODE.");
    return false;
  }
  return null;
}

export async function processTelegramUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message?.chat?.id) return { ignored: true };

  const chatId = message.chat.id;
  const from = message.from || {};
  const command = parseTelegramCommand(message);
  const link = await TelegramLink.findOne({ telegramUserId: String(from.id) });

  logger.info("telegram", "Update received", {
    updateId: update.update_id,
    chatId,
    telegramUserId: from.id,
    intent: command.intent
  });

  const linkGate = await requireLinkedUser({ command, link, chatId });
  if (linkGate === false) return { success: true, skipped: "unlinked" };
  if (typeof linkGate === "string") {
    await sendTelegramMessage(chatId, linkGate);
    return { success: true };
  }

  await sendTelegramTyping(chatId);

  try {
    if (command.intent === "link") {
      await sendTelegramMessage(chatId, await linkTelegramAccount({ code: command.code, from, chatId }));
      return { success: true };
    }

    const userId = link.userId;

    if (command.intent === "list_tasks") {
      const tasks = await listTasks(userId);
      await sendTelegramMessage(chatId, tasks.length ? tasks.slice(0, 10).map(formatTask).join("\n\n") : "No tasks found.");
    } else if (command.intent === "create_task" || command.intent === "create_reminder") {
      const task = await createTask(userId, normalizeTaskInput(command.task, command.intent === "create_reminder" ? "Telegram reminder" : "Telegram task"));
      await sendTelegramMessage(chatId, `Created task:\n${formatTask(task)}`);
    } else if (command.intent === "semantic_search") {
      if (!command.query) {
        await sendTelegramMessage(chatId, "Please include what you want to search.\nExample: /search TCP congestion control");
        return { success: true };
      }
      const results = await searchDocumentChunks({ userId, query: command.query, limit: 10 });
      const relevantResults = prepareTelegramSearchResults(results);
      await sendTelegramMessage(
        chatId,
        relevantResults.length
          ? formatSearchResults(relevantResults)
          : `I could not find relevant uploaded document content for "${escapeHtml(command.query)}". Try uploading notes on this topic first, or ask with /ask ${escapeHtml(command.query)}.`
      );
    } else if (command.intent === "workspace_chat" || command.intent === "ai_fallback") {
      if (!command.message) {
        await sendTelegramMessage(chatId, "Ask me anything.\nExample: What is SQL?");
        return { success: true };
      }
      const result = await chat({ userId, message: command.message, mode: "workspace" });
      await sendTelegramMessage(chatId, markdownToTelegramHtml(result.answer));
    } else if (command.intent === "coding_assistant") {
      if (!command.message) {
        await sendTelegramMessage(chatId, "Send code or a coding question.\nExample: /code explain a C factorial program");
        return { success: true };
      }
      const result = await chat({ userId, message: command.message, mode: "coding" });
      await sendTelegramMessage(chatId, markdownToTelegramHtml(result.answer));
    } else if (command.intent === "memory") {
      const memories = command.query
        ? await findRelevantMemories(userId, command.query, 5)
        : await listMemories(userId);
      await sendTelegramMessage(chatId, memories.length
        ? memories.slice(0, 8).map((item) => `- ${escapeHtml(item.content || item.text || "")}`).join("\n")
        : "No memories found.");
    } else if (command.intent === "send_mail") {
      if (!command.mail.to || !command.mail.subject || !command.mail.body) {
        throw new ApiError(400, "Use: /mail to: person@email.com subject: Hello body: Message text");
      }
      const result = await sendGmailEmail({ userId, ...command.mail });
      await sendTelegramMessage(chatId, `Email sent.\nMessage id: ${escapeHtml(result.id)}`);
    } else {
      await sendTelegramMessage(chatId, helpText());
    }

    return { success: true };
  } catch (error) {
    logger.error("telegram", "Command failed", {
      updateId: update.update_id,
      chatId,
      intent: command.intent,
      error: error.message
    });
    await sendTelegramMessage(chatId, `Sorry, I could not complete that request.\n${escapeHtml(error.message)}`);
    return { success: false, error: error.message };
  }
}
