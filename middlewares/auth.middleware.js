import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/env.js";
import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import { extractAccessToken, extractRefreshToken, hashRefreshToken, verifyToken } from "../utils/middleware.util.js";

export const authorize = async (req, res, next) => {

    try {
        
        let token;

        if (req.headers.authorization &&req.headers.authorization.startsWith("Bearer")) {
          token = req.headers.authorization.split(" ")[1];
        }

        if(!token) return res.status(401).json({ success: false, message: "Unauthorized" })
        
        const decoded = jwt.verify(token, JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select("-password")

        if(!user) return res.status(401).json({ message: "Unauthorized" })

        req.user = user
        req.token = token

        next()

    } catch (error) {
        console.error(error)
        return res.status(401).json({ success: false, message: "Unauthorized" })
    }

}

// export const logoutMiddleware = async (req, res, next) => {
//   try {

//     let token;
  
//     if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//       token = req.headers.authorization.split(" ")[1];
//     } else {
//       token = req.cookies.refreshToken
//     }

//     if (!token) {
//       req.session = null
//       return next()
//     }

//     if(req.headers.authorization.startsWith("Bearer") && req.cookies.refreshToken) {
//       const accessToken = req.headers.authorization.split(" ")[1];
//       const refreshToken = req.cookies.refreshToken

//       const accessDecoded = jwt.verify(accessToken, JWT_SECRET)
//       const refreshDecoded = jwt.verify(refreshToken, JWT_SECRET)

//       if (
//         accessDecoded.userId !== refreshDecoded.userId ||
//         accessDecoded.sessionId !== refreshDecoded.sessionId
//       ) {
//         await session.revoke("system", "Token Payloads mismatch");
//         req.session = null;
//         return next();
//       }
//     }
  
//     const decoded = jwt.verify(token, JWT_SECRET)
  
//     const session = await sessionModel.findById(decoded.sessionId).select("+refreshTokenHash");
  
//     if(!session || session.status !== "active") {
//       req.session = null
//       return next()
//     }

//     if(decoded.type === "refresh") {
//       const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex")
//       if(session.refreshTokenHash !== refreshTokenHash) {
//         await session.revoke("system", "Refresh token hash mismatch"); 
//         req.session = null
//         return next()
//       }
//     }

//     if(session.user.toString() !== decoded.userId) {
//       await session.revoke("system", "Token/session user mismatch"); // revoke over logout since this case is a possible security/integrity violation, not a normal user-initiated logout
//       req.session = null
//       return next()
//     }
  
//     req.session = session
//     req.token = decoded

//     return next()

//   } catch (error) {
//     console.error(error)
//     req.session = null
//     return next()
//   }
// }

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

    if (!session || session.status !== "active") {
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