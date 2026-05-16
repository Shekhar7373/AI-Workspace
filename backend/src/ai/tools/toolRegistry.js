import { searchDocumentChunks } from "../../services/documentService.js";
import { createGmailDraft, listRecentEmails, sendGmailEmail } from "../../services/gmailService.js";
import { createMemory } from "../../services/memoryService.js";
import { createTask, listTasks } from "../../services/taskService.js";
import { ApiError } from "../../utils/apiError.js";

function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${field} is required.`);
  }
  return value.trim();
}

function optionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLimit(value, fallback = 5, max = 10) {
  const limit = Number(value) || fallback;
  return Math.min(Math.max(limit, 1), max);
}

function serializeDoc(doc) {
  if (!doc) return doc;
  if (typeof doc.toObject === "function") return doc.toObject();
  return doc;
}

function normalizeTaskInput(task) {
  const title = requireString(task.title, "task title");
  const data = {
    title,
    description: optionalString(task.description),
    priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
    status: ["todo", "in_progress", "done"].includes(task.status) ? task.status : "todo"
  };

  if (task.deadline) {
    const deadline = new Date(task.deadline);
    if (Number.isNaN(deadline.getTime())) throw new ApiError(400, "deadline must be a valid date.");
    data.deadline = deadline;
  }

  return data;
}

export const toolDefinitions = [
  {
    name: "search_documents",
    description: "Search the user's uploaded documents semantically for relevant study or project context.",
    approvalRequired: false,
    parameters: {
      query: "string, required",
      documentId: "string, optional",
      limit: "number, optional, 1-10"
    },
    execute: async ({ userId, arguments: args }) => {
      const query = requireString(args.query, "query");
      const results = await searchDocumentChunks({
        userId,
        query,
        documentId: optionalString(args.documentId) || undefined,
        limit: normalizeLimit(args.limit)
      });
      return results.map((item) => ({
        score: item.score,
        text: item.payload?.text || "",
        documentId: item.payload?.documentId
      }));
    }
  },
  {
    name: "list_tasks",
    description: "List the user's current tasks and deadlines.",
    approvalRequired: false,
    parameters: {},
    execute: async ({ userId }) => {
      const tasks = await listTasks(userId);
      return tasks.map(serializeDoc);
    }
  },
  {
    name: "create_task",
    description: "Create a task for a study plan, deadline, reminder, or follow-up.",
    approvalRequired: true,
    parameters: {
      title: "string, required",
      description: "string, optional",
      deadline: "ISO date string, optional",
      priority: "low | medium | high, optional",
      status: "todo | in_progress | done, optional"
    },
    execute: async ({ userId, arguments: args }) => {
      const data = normalizeTaskInput(args);
      return serializeDoc(await createTask(userId, data));
    }
  },
  {
    name: "create_study_plan_tasks",
    description: "Create multiple approved tasks from a study goal, revision plan, or deadline workflow.",
    approvalRequired: true,
    parameters: {
      tasks: "array of 1-10 task objects with title, description, deadline, priority, and status"
    },
    execute: async ({ userId, arguments: args }) => {
      if (!Array.isArray(args.tasks) || args.tasks.length === 0) {
        throw new ApiError(400, "tasks must include at least one task.");
      }

      const normalizedTasks = args.tasks.slice(0, 10).map(normalizeTaskInput);
      const createdTasks = [];

      for (const task of normalizedTasks) {
        createdTasks.push(serializeDoc(await createTask(userId, task)));
      }

      return createdTasks;
    }
  },
  {
    name: "save_memory",
    description: "Save a useful long-term memory about the user's preferences, goals, weak areas, or projects.",
    approvalRequired: true,
    parameters: {
      content: "string, required",
      type: "preference | study_habit | weak_subject | coding_interest | project | goal | conversation | custom, optional"
    },
    execute: async ({ userId, arguments: args }) => {
      const content = requireString(args.content, "content");
      const allowedTypes = ["preference", "study_habit", "weak_subject", "coding_interest", "project", "goal", "conversation", "custom"];
      const type = allowedTypes.includes(args.type) ? args.type : "custom";
      return serializeDoc(await createMemory({ userId, type, content, source: "agent_tool" }));
    }
  },
  {
    name: "list_recent_emails",
    description: "List recent Gmail messages for the connected Google account.",
    approvalRequired: false,
    parameters: {
      query: "string, optional Gmail search query",
      limit: "number, optional, 1-10"
    },
    execute: async ({ userId, arguments: args }) => listRecentEmails({
      userId,
      query: optionalString(args.query),
      limit: normalizeLimit(args.limit)
    })
  },
  {
    name: "create_gmail_draft",
    description: "Create a Gmail draft after user approval.",
    approvalRequired: true,
    parameters: {
      to: "string, required",
      subject: "string, required",
      body: "string, required",
      threadId: "string, optional",
      inReplyTo: "string, optional",
      references: "string, optional"
    },
    execute: async ({ userId, arguments: args }) => createGmailDraft({
      userId,
      to: requireString(args.to, "to"),
      subject: requireString(args.subject, "subject"),
      body: requireString(args.body, "body"),
      threadId: optionalString(args.threadId),
      inReplyTo: optionalString(args.inReplyTo),
      references: optionalString(args.references)
    })
  },
  {
    name: "send_gmail_email",
    description: "Send an email through Gmail after explicit user approval.",
    approvalRequired: true,
    parameters: {
      to: "string, required",
      subject: "string, required",
      body: "string, required",
      threadId: "string, optional",
      inReplyTo: "string, optional",
      references: "string, optional"
    },
    execute: async ({ userId, arguments: args }) => sendGmailEmail({
      userId,
      to: requireString(args.to, "to"),
      subject: requireString(args.subject, "subject"),
      body: requireString(args.body, "body"),
      threadId: optionalString(args.threadId),
      inReplyTo: optionalString(args.inReplyTo),
      references: optionalString(args.references)
    })
  }
];

export function getToolDefinition(name) {
  return toolDefinitions.find((tool) => tool.name === name);
}

export function listToolDefinitions() {
  return toolDefinitions.map(({ execute, ...tool }) => tool);
}
