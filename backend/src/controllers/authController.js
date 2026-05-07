import { asyncHandler } from "../utils/asyncHandler.js";
import { registerUser, loginUser, refreshUserToken, logoutUser } from "../services/authService.js";
import { ApiError } from "../utils/apiError.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email, and password are required.");
  const payload = await registerUser(req.body);
  res.status(201).json({ success: true, ...payload });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required.");
  const payload = await loginUser({ email, password });
  res.json({ success: true, ...payload });
});

export const refresh = asyncHandler(async (req, res) => {
  const payload = await refreshUserToken(req.body.refreshToken);
  res.json({ success: true, ...payload });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user._id);
  res.json({ success: true, message: "Logged out successfully." });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
