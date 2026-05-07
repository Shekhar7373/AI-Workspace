import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.accessTokenExpiresIn }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id.toString(), tokenVersion: user.tokenVersion },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenExpiresIn }
  );
}
