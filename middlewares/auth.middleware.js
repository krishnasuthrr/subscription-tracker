import sessionModel from "../models/session.model.js";
import { extractAccessToken, extractRefreshToken, hashRefreshToken, verifyToken } from "../utils/middleware.util.js";
import { UnauthorizedError } from "../utils/error.util.js";

export const authorize = async (req, res, next) => {

    try {

      req.auth = null;
      req.session = null;
      
      const accessToken = extractAccessToken(req)
      if(!accessToken) {
        throw new UnauthorizedError()
      }

      const decoded = verifyToken(accessToken)
      if(!decoded) {
        const error = new Error(
          `Unauthorized${verifyToken.failureReason ? `, ${verifyToken.failureReason}` : ""}`,
        );
        error.statusCode = 401
        throw error
      }

      const session = await sessionModel.findById(decoded.sessionId)
      if(!session || !session.isActive) {
        throw new UnauthorizedError()
      }

      if (session.user.toString() !== decoded.userId) {
        await session.revoke("system", "Token/session ownership mismatch");
        throw new UnauthorizedError
      }

      req.auth = decoded;
      req.session = session;
      next()

    } catch (error) {
      next(error)
    }

}

export const logoutMiddleware = async (req, res, next) => {

  try {

    req.auth = null;
    req.session = null;

    const accessToken = extractAccessToken(req)
    const refreshToken = extractRefreshToken(req)

    if (!accessToken && !refreshToken) {
      return next();
    }

    const accessDecoded = accessToken ? verifyToken(accessToken) : null
    const refreshDecoded = refreshToken ? verifyToken(refreshToken) : null;

    if (!accessDecoded && !refreshDecoded) {
      return next();
    }

    if (accessDecoded && refreshDecoded) {
      if (
        accessDecoded.userId !== refreshDecoded.userId ||
        accessDecoded.sessionId !== refreshDecoded.sessionId
      ) {
        // warn/audit threat using logger
        return next();
      }
    }

    const auth = refreshDecoded || accessDecoded;

    const session = await sessionModel.findById(auth.sessionId).select("+refreshTokenHash")

    if (!session || !session.isActive) {
      return next()
    }

    if (session.user.toString() !== auth.userId) {
      await session.revoke("system", "Token/session ownership mismatch");
      return next();
    }

    if (refreshDecoded) {
      const incomingHash = hashRefreshToken(refreshToken);

      if (session.refreshTokenHash !== incomingHash) {
        await session.revoke("system", "Refresh token hash mismatch");
        return next();
      }
    }

     req.auth = auth;
     req.session = session;
     return next();

  } catch (error) {
    console.error(error)
    req.auth = null;
    req.session = null;
    return next();
  }

}