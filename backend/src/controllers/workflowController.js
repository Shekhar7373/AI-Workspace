import { suggestLocalWorkflow } from "../ai/workflows/localWorkflowService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const suggestLocalWorkflowController = asyncHandler(async (req, res) => {
  const result = await suggestLocalWorkflow({
    userId: req.user._id,
    goal: req.body.goal,
    focus: req.body.focus
  });

  res.json({ success: true, ...result });
});
