import { google } from "googleapis";
import { getAuthorizedGoogleClient, markGoogleIntegrationInvalid } from "./googleOAuthService.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/apiError.js";

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function headerValue(headers = [], name) {
  return headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

function createMimeMessage({ to, subject, body, inReplyTo = "", references = "" }) {
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0"
  ];

  if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
  if (references) headers.push(`References: ${references}`);

  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

async function gmailClient(userId) {
  const auth = await getAuthorizedGoogleClient(userId);
  return google.gmail({ version: "v1", auth });
}

function isInvalidGrant(error) {
  const message = String(error?.message || error?.response?.data?.error || "");
  return message.includes("invalid_grant") || error?.response?.data?.error === "invalid_grant";
}

async function withGmailAuthHandling(userId, action) {
  try {
    return await action();
  } catch (error) {
    if (!isInvalidGrant(error)) throw error;

    await markGoogleIntegrationInvalid(userId, "invalid_grant");
    throw new ApiError(
      409,
      "Google connection expired or was revoked. Open Settings, connect Google again, then retry the Gmail action."
    );
  }
}

export async function listRecentEmails({ userId, query = "", limit = 5 }) {
  logger.info("gmail", "Listing recent emails", {
    userId: userId.toString(),
    query: query || "none",
    limit
  });
  return withGmailAuthHandling(userId, async () => {
    const gmail = await gmailClient(userId);
    const { data } = await gmail.users.messages.list({
      userId: "me",
      maxResults: Math.min(Math.max(Number(limit) || 5, 1), 10),
      q: query || undefined
    });

    const messages = data.messages || [];
    const details = await Promise.all(messages.map(async (message) => {
      const { data: item } = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date", "Message-ID", "References"]
      });

      return {
        id: item.id,
        threadId: item.threadId,
        snippet: item.snippet,
        from: headerValue(item.payload?.headers, "From"),
        to: headerValue(item.payload?.headers, "To"),
        subject: headerValue(item.payload?.headers, "Subject"),
        date: headerValue(item.payload?.headers, "Date"),
        messageId: headerValue(item.payload?.headers, "Message-ID"),
        references: headerValue(item.payload?.headers, "References")
      };
    }));

    return details;
  });
}

export async function createGmailDraft({ userId, to, subject, body, threadId, inReplyTo, references }) {
  logger.info("gmail", "Creating Gmail draft", {
    userId: userId.toString(),
    to,
    subject,
    hasThread: Boolean(threadId)
  });
  return withGmailAuthHandling(userId, async () => {
    const gmail = await gmailClient(userId);
    const raw = base64Url(createMimeMessage({ to, subject, body, inReplyTo, references }));
    const { data } = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw,
          threadId: threadId || undefined
        }
      }
    });

    return {
      id: data.id,
      messageId: data.message?.id,
      threadId: data.message?.threadId
    };
  });
}

export async function sendGmailEmail({ userId, to, subject, body, threadId, inReplyTo, references }) {
  logger.info("gmail", "Sending Gmail email", {
    userId: userId.toString(),
    to,
    subject,
    hasThread: Boolean(threadId)
  });
  return withGmailAuthHandling(userId, async () => {
    const gmail = await gmailClient(userId);
    const raw = base64Url(createMimeMessage({ to, subject, body, inReplyTo, references }));
    const { data } = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
        threadId: threadId || undefined
      }
    });

    return {
      id: data.id,
      threadId: data.threadId,
      labelIds: data.labelIds || []
    };
  });
}
