import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { runAgent } from "../ai/agents/agentService.js";

export const runAgentController = asyncHandler(async (req, res) => {
  const { agent, objective, context } = req.body;
  if (!objective) throw new ApiError(400, "Agent objective is required.");
  const result = await runAgent({ userId: req.user._id, agent, objective, context });
  res.json({ success: true, ...result });
});
