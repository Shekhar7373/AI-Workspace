import { groq, assertGroqKey } from "../../config/groq.js";
import { env } from "../../config/env.js";
import { agentSystemPrompt } from "../prompts/systemPrompts.js";
import { createMemory } from "../../services/memoryService.js";
import { executeToolCalls, executeToolCall, getAvailableToolsPrompt } from "../tools/toolExecutor.js";
import { listToolDefinitions } from "../tools/toolRegistry.js";
import { extractJsonObject } from "../utils/json.js";

const agentProfiles = {
  study: "Study Agent: plans learning sessions, revision, weak-topic recovery, and exam preparation.",
  reminder: "Reminder Agent: converts goals into reminders and task follow-ups.",
  notes: "Notes Summarizer: extracts summaries, definitions, and revision cards from notes.",
  coding: "Coding Tutor: explains code, debugging, DSA, and project architecture.",
  research: "Research Agent: breaks questions into research steps and synthesizes findings."
};

export async function runAgent({
  userId,
  agent = "study",
  objective,
  context = "",
  useTools = true,
  executeTools = false
}) {
  assertGroqKey();
  const profile = agentProfiles[agent] || agentProfiles.study;
  const toolPrompt = useTools
    ? `\n\nAvailable tools:\n${getAvailableToolsPrompt()}\n\nRespond as JSON only using this shape:\n{
  "answer": "short user-facing answer",
  "toolCalls": [
    { "tool": "tool_name", "arguments": { } }
  ]
}
Only include toolCalls that are genuinely useful. Write actions require approval unless executeTools is explicitly true.`
    : "";

  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      { role: "system", content: `${agentSystemPrompt}\n${profile}${toolPrompt}` },
      { role: "user", content: JSON.stringify({ objective, context }) }
    ]
  });

  const output = response.choices[0].message.content || "";
  const parsed = useTools ? extractJsonObject(output) : null;
  const toolCalls = Array.isArray(parsed?.toolCalls) ? parsed.toolCalls : [];
  const toolResults = useTools
    ? await executeToolCalls({
        userId,
        toolCalls,
        requireApproval: !executeTools,
        maxToolCalls: 3
      }).catch((error) => [{ error: error.message }])
    : [];

  await createMemory({
    userId,
    type: "conversation",
    content: `Agent ${agent} worked on: ${objective}`,
    source: "agent"
  }).catch(() => {});

  return {
    agent,
    output: parsed?.answer || output,
    toolCalls,
    toolResults,
    pendingApproval: toolResults.filter((result) => result.approvalRequired && result.skipped)
  };
}

export function getAgentTools() {
  return listToolDefinitions();
}

export async function executeApprovedAgentTool({ userId, toolCall }) {
  return executeToolCall({ userId, toolCall, requireApproval: false });
}
