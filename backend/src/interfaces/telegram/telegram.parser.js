function normalizeText(text = "") {
  return String(text).trim().replace(/\s+/g, " ");
}

function parseKeyValue(text, keys) {
  const result = {};
  for (const key of keys) {
    const nextKeys = keys.filter((item) => item !== key).join("|");
    const pattern = new RegExp(`${key}\\s*:\\s*([\\s\\S]*?)(?=\\s+(?:${nextKeys})\\s*:|$)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) result[key.toLowerCase()] = match[1].trim();
  }
  return result;
}

function parseNaturalDateTime(text) {
  const lower = text.toLowerCase();
  const date = new Date();

  if (/\btomorrow\b/.test(lower)) {
    date.setDate(date.getDate() + 1);
  } else if (!/\btoday\b/.test(lower)) {
    const iso = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    const dmy = lower.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);

    if (iso) {
      const parsed = new Date(`${iso[1]}T09:00:00`);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }

    if (dmy) {
      const [, day, month, year] = dmy;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day), 9, 0, 0);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }

    return undefined;
  }

  const time = lower.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (time) {
    let hour = Number(time[1]);
    const minute = Number(time[2] || 0);
    const meridiem = time[3];
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    date.setHours(hour, minute, 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function cleanNaturalTaskTitle(text) {
  return text
    .replace(/^\/task\s*/i, "")
    .replace(/^\/remind\s+(me\s+)?(to|of|about)?\s*/i, "")
    .replace(/^(create|add)\s+(a\s+)?task\s*/i, "")
    .replace(/^remind\s+me\s+(to|of|about)?\s*/i, "")
    .replace(/^(called|named|titled)\s+/i, "")
    .replace(/\b(today|tomorrow)\b.*$/i, "")
    .replace(/\b(on|by|before|at)\s+\d{1,2}[-/]\d{1,2}[-/]\d{4}.*$/i, "")
    .replace(/\b(on|by|before)\s+\d{4}-\d{2}-\d{2}.*$/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function parseTaskText(raw) {
  const text = raw.replace(/^\/(?:task|remind)\s*/i, "").trim();
  const fields = parseKeyValue(text, ["title", "description", "deadline", "priority"]);
  const quotedTitle = text.match(/\b(?:title|titled|called|named)\s*:?\s*["']([^"']+)["']/i)
    || text.match(/["']([^"']+)["']/);
  const naturalTitle = quotedTitle?.[1] || cleanNaturalTaskTitle(raw);
  const naturalDeadline = parseNaturalDateTime(text);

  return {
    title: fields.title || naturalTitle || text,
    description: fields.description || "",
    deadline: fields.deadline || naturalDeadline,
    priority: ["low", "medium", "high"].includes(fields.priority) ? fields.priority : "medium"
  };
}

function parseMailText(raw) {
  const text = raw.replace(/^\/mail\s*/i, "").trim();
  const fields = parseKeyValue(text, ["to", "subject", "body"]);
  const fallback = text.match(/to\s+(\S+@\S+)\s+subject\s+(.+?)\s+body\s+([\s\S]+)/i);
  return {
    to: fields.to || fallback?.[1] || "",
    subject: fields.subject || fallback?.[2] || "",
    body: fields.body || fallback?.[3] || ""
  };
}

export function parseTelegramCommand(message = {}) {
  const text = normalizeText(message.text || message.caption || "");
  if (!text) return { intent: "empty" };

  const [rawCommand, ...rest] = text.split(" ");
  const command = rawCommand.replace(/@[\w_]+$/, "").toLowerCase();
  const args = rest.join(" ").trim();

  if (command === "/start") return { intent: "start" };
  if (command === "/help") return { intent: "help" };
  if (command === "/link") return { intent: "link", code: args };
  if (command === "/tasks") return { intent: "list_tasks" };
  if (command === "/task") return { intent: "create_task", task: parseTaskText(text) };
  if (command === "/remind") return { intent: "create_reminder", task: parseTaskText(text) };
  if (command === "/search") return { intent: "semantic_search", query: args };
  if (command === "/ask") return { intent: "workspace_chat", message: args };
  if (command === "/chat") return { intent: "workspace_chat", message: args };
  if (command === "/ai") return { intent: "workspace_chat", message: args };
  if (command === "/code") return { intent: "coding_assistant", message: args };
  if (command === "/memory") return { intent: "memory", query: args };
  if (command === "/mail") return { intent: "send_mail", mail: parseMailText(text) };

  const lower = text.toLowerCase();
  if (/^(create|add)\s+(a\s+)?task\b/.test(lower)) {
    return { intent: "create_task", task: { title: text.replace(/^(create|add)\s+(a\s+)?task\s*/i, "") || text } };
  }
  if (/^(remind me|reminder)\b/.test(lower)) {
    return { intent: "create_reminder", task: { title: text.replace(/^(remind me|reminder)\s*/i, "") || text } };
  }
  if (/^(list|show)\s+(my\s+)?tasks\b/.test(lower)) return { intent: "list_tasks" };
  if (/^(search|find)\b/.test(lower)) return { intent: "semantic_search", query: text.replace(/^(search|find)\s*/i, "") };
  if (/^(remember|memory|what do you remember)\b/.test(lower)) return { intent: "memory", query: text.replace(/^(remember|memory|what do you remember)\s*/i, "") };
  if (/^(debug|explain|fix|write code|generate code)\b/.test(lower)) return { intent: "coding_assistant", message: text };
  if (/^(send|draft)\s+(an\s+)?(email|mail)\b/.test(lower)) return { intent: "send_mail", mail: parseMailText(text.replace(/^(send|draft)\s+(an\s+)?(email|mail)\s*/i, "")) };

  return { intent: "ai_fallback", message: text };
}
