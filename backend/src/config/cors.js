import { env } from "./env.js";

export function corsOrigin(origin, callback) {
  if (!origin || env.clientUrls.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS.`));
}

export const corsOptions = {
  origin: corsOrigin,
  credentials: true
};
