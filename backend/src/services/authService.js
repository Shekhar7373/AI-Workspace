import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { signAccessToken, signRefreshToken } from "../utils/tokens.js";
import { env } from "../config/env.js";

function authPayload(user) {
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences
    },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user)
  };
}

export async function registerUser(data) {
  const exists = await User.exists({ email: data.email });
  if (exists) throw new ApiError(409, "Email is already registered.");

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    preferences: data.preferences
  });

  return authPayload(user);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return authPayload(user);
}

export async function refreshUserToken(refreshToken) {
  if (!refreshToken) throw new ApiError(401, "Refresh token missing.");

  const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
  const user = await User.findById(decoded.id);
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw new ApiError(401, "Refresh token is no longer valid.");
  }

  return authPayload(user);
}

export async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}
