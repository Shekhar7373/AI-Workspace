import { ApiError } from "../../utils/apiError.js";
import { getToolDefinition, listToolDefinitions } from "./toolRegistry.js";

export function getAvailableToolsPrompt() {
  return listToolDefinitions()
    .map((tool) => {
      const approval = tool.approvalRequired ? "requires user approval" : "safe to execute";
      return `- ${tool.name}: ${tool.description} (${approval}). Parameters: ${JSON.stringify(tool.parameters)}`;
    })
    .join("\n");
}

export async function executeToolCall({ userId, toolCall, requireApproval = true }) {
  const name = toolCall?.tool || toolCall?.name;
  const tool = getToolDefinition(name);
  if (!tool) throw new ApiError(400, `Unknown tool: ${name || "missing"}.`);

  if (requireApproval && tool.approvalRequired) {
    return {
      tool: tool.name,
      approvalRequired: true,
      skipped: true,
      arguments: toolCall.arguments || {}
    };
  }

  const result = await tool.execute({
    userId,
    arguments: toolCall.arguments || {}
  });

  return {
    tool: tool.name,
    approvalRequired: tool.approvalRequired,
    skipped: false,
    result
  };
}

export async function executeToolCalls({ userId, toolCalls = [], requireApproval = true, maxToolCalls = 3 }) {
  const limitedCalls = toolCalls.slice(0, maxToolCalls);
  const results = [];

  for (const toolCall of limitedCalls) {
    results.push(await executeToolCall({ userId, toolCall, requireApproval }));
  }

  return results;
}
