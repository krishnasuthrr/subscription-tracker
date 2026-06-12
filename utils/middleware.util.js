import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { JWT_SECRET } from "../config/env.js";

export function extractAccessToken(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
}

export function extractRefreshToken(req) {
  return req.cookies.refreshToken || null;
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
