import { groq, assertGroqKey } from "../../config/groq.js";
import { env } from "../../config/env.js";
import { Document } from "../../models/Document.js";
import { Memory } from "../../models/Memory.js";
import { Task } from "../../models/Task.js";
import { executeToolCalls, getAvailableToolsPrompt } from "../tools/toolExecutor.js";
import { extractJsonObject } from "../utils/json.js";

async function getWorkspaceSnapshot(userId) {
  const [documents, pendingTasks, memories, overdueTasks] = await Promise.all([
    Document.find({ userId }).sort({ updatedAt: -1 }).limit(8).select("title subject tags processingStatus chunkCount updatedAt"),
    Task.find({ userId, status: { $ne: "done" } }).sort({ deadline: 1, createdAt: -1 }).limit(12),
    Memory.find({ userId }).sort({ updatedAt: -1 }).limit(8).select("type content source updatedAt"),
    Task.find({
      userId,
      status: { $ne: "done" },
      deadline: { $lt: new Date() }
    }).sort({ deadline: 1 }).limit(8)
  ]);

  return { documents, pendingTasks, memories, overdueTasks };
}

export async function suggestLocalWorkflow({ userId, goal = "", focus = "study" }) {
  assertGroqKey();
  const snapshot = await getWorkspaceSnapshot(userId);

  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      {
        role: "system",
        content: `You create practical local workflow suggestions for a student/developer AI workspace.
Use only internal workspace tools. Prefer useful task and memory proposals.
Do not suggest Gmail, Calendar, or external integrations.

Available tools:
${getAvailableToolsPrompt()}

Respond as JSON only:
{
  "summary": "short explanation of the workflow",
  "toolCalls": [
    { "tool": "tool_name", "arguments": { } }
  ]
}

Use at most 5 tool calls. Batch related study tasks with create_study_plan_tasks.`
      },
      {
        role: "user",
        content: JSON.stringify({
          focus,
          goal,
          workspace: snapshot
        })
      }
    ]
  });

  const output = response.choices[0].message.content || "";
  const parsed = extractJsonObject(output);
  const toolCalls = Array.isArray(parsed?.toolCalls) ? parsed.toolCalls.slice(0, 5) : [];
  const toolResults = await executeToolCalls({
    userId,
    toolCalls,
    requireApproval: true,
    maxToolCalls: 5
  }).catch((error) => [{ error: error.message }]);

  return {
    summary: parsed?.summary || output,
    toolCalls,
    toolResults,
    pendingApproval: toolResults.filter((result) => result.approvalRequired && result.skipped)
  };
}
