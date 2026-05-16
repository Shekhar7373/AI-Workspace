import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { executeApprovedAgentTool, getAgentTools, runAgent } from "../ai/agents/agentService.js";

export const runAgentController = asyncHandler(async (req, res) => {
  const { agent, objective, context, useTools, executeTools } = req.body;
  if (!objective) throw new ApiError(400, "Agent objective is required.");
  const result = await runAgent({
    userId: req.user._id,
    agent,
    objective,
    context,
    useTools,
    executeTools
  });
  res.json({ success: true, ...result });
});

export const getAgentToolsController = asyncHandler(async (req, res) => {
  res.json({ success: true, tools: getAgentTools() });
});

export const executeAgentToolController = asyncHandler(async (req, res) => {
  const { toolCall } = req.body;
  if (!toolCall) throw new ApiError(400, "toolCall is required.");
  const result = await executeApprovedAgentTool({ userId: req.user._id, toolCall });
  res.json({ success: true, result });
});
