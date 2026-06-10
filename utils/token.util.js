import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/env.js"
import { REFRESH_EXP_DAYS, ACCESS_EXP_MINUTES } from "../config/auth.config.js"

export const generateRefreshToken = ({ userId, sessionId }) => {
  const refreshToken = jwt.sign(
    {
      userId,
      sessionId,
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_EXP_DAYS,
    },
  );

  return refreshToken
};

export const generateAccessToken = ({ userId, sessionId }) => {
  const accessToken = jwt.sign(
    {
      userId,
      sessionId,
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_EXP_MINUTES,
    },
  );

  return accessToken
};

