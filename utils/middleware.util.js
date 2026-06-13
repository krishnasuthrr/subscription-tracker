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
  verifyToken.failureReason = null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    verifyToken.failureReason = getFailureReason(error);
    return null;
  }
}

function getFailureReason(error) {
  if (error instanceof jwt.TokenExpiredError) {
    return "Expired token";
  }

  if (error instanceof jwt.NotBeforeError) {
    return "Token not active";
  }

  if (error instanceof jwt.JsonWebTokenError) {
    if (error.message === "invalid signature") {
      return "Invalid secret";
    }

    if (error.message === "jwt malformed") {
      return "Malformed token";
    }

    if (error.message === "jwt must be provided") {
      return "Missing token";
    }

    return "Invalid token";
  }

  return "Token verification failed";
}

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
