import { REFRESH_EXP_MS } from "./auth.config.js";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth/refresh",
  maxAge: REFRESH_EXP_MS
};

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth/",
  maxAge: REFRESH_EXP_MS,
};
