import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import { z } from "zod";

import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import { generateRefreshToken, generateAccessToken } from "../utils/token.util.js";
import { hashRefreshToken } from "../utils/middleware.util.js";
import { authCookieOptions } from "../config/cookie.config.js";

export const signUp = async (req, res, next) => {
  const signUpSchema = z.object({
    name: z
      .string()
      .trim()
      .min(3, "name must be at least 3 characters")
      .max(50, "name must be 50 characters or fewer"),
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .transform((value) => value.toLowerCase()),
    password: z.string().min(6, "password must be at least 6 characters"),
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password } = signUpSchema.parse(req.body);

    const existingUser = await userModel.findOne({ email }).session(session);
    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [user] = await userModel.create(
      [{ name, email, password: hashedPassword }],
      { session },
    );

    const userAgent = req.headers["user-agent"] || null;
    const parsedUA = new UAParser(userAgent).getResult();
    const ipLookup = geoip.lookup(req.ip);
    const sessionId = new mongoose.Types.ObjectId();

    const refreshToken = generateRefreshToken({
      userId: user._id,
      sessionId: sessionId.toString(),
    });

    const accessToken = generateAccessToken({
      userId: user._id,
      sessionId: sessionId.toString(),
    });

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const [userSession] = await sessionModel.create(
      [
        {
          _id: sessionId,
          user: user._id,
          refreshTokenHash,
          ipAddress: req.ip,
          userAgent,
          device: {
            browser: parsedUA.browser.name || null,
            type: parsedUA.device.type || "unknown",
            os: parsedUA.os.name
              ? `${parsedUA.os.name} ${parsedUA.os.version || ""}`.trim()
              : null,
            location: {
              country: ipLookup?.country || null,
              region: ipLookup?.region || null,
              city: ipLookup?.city || null,
            },
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.cookie("refreshToken", refreshToken, authCookieOptions);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        userId: user._id,
        sessionId: userSession._id,
        accessToken,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof z.ZodError) {
      const validationMessage = z.flattenError(error);

      return res.status(400).json({
        success: false,
        message: "Auth input validation error",
        errors: validationMessage,
      });
    }
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  const signInSchema = z.object({
    email: z.string().trim().email("Please provide a valid email address").transform((v) => v.toLowerCase()),
    password: z.string().min(6, "password must be at least 6 characters"),
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password } = signInSchema.parse(req.body);

    const user = await userModel.findOne({ email }).session(session);

    if (!user) {
      const error = new Error("User not Found");
      error.statusCode = 404;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Incorrect Password");
      error.statusCode = 401;
      throw error;
    }

    const userAgent = req.headers["user-agent"] || null;
    const parsedUA = new UAParser(userAgent).getResult();
    const ipLookup = geoip.lookup(req.ip);

    const sessionId = new mongoose.Types.ObjectId();

    const refreshToken = generateRefreshToken({
      userId: user._id,
      sessionId: sessionId.toString(),
    });

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const [userSession] = await sessionModel.create(
      [
        {
          _id: sessionId,
          user: user._id,
          refreshTokenHash,
          ipAddress: req.ip,
          userAgent,
          device: {
            browser: parsedUA.browser.name || null,
            type: parsedUA.device.type || "unknown",
            os: parsedUA.os.name ? `${parsedUA.os.name} ${parsedUA.os.version || ""}`.trim() : null,
            location: {
              country: ipLookup?.country || null,
              region: ipLookup?.region || null,
              city: ipLookup?.city || null,
            },
          },
        },
      ],
      { session },
    );

    const accessToken = generateAccessToken({
      userId: user._id,
      sessionId: sessionId.toString(),
    });

    await session.commitTransaction();
    session.endSession();

    res.cookie("refreshToken", refreshToken, authCookieOptions);

    res.status(200).json({
      success: true,
      message: "User Logged In Successfully",
      data: {
        id: user._id,
        session: userSession,
        accessToken,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof z.ZodError) {
      const validationMessage = z.flattenError(error);

      return res.status(400).json({
        success: false,
        message: "Auth input validation error",
        errors: validationMessage,
      });
    }
    next(error);
  }
};


export const signOut = async (req, res) => {

  const logoutSuccess = () => {
    // eslint-disable-next-line no-unused-vars
    const { maxAge, ...clearOptions } = authCookieOptions;

    res.clearCookie("refreshToken", clearOptions);

    res.clearCookie("accessToken", clearOptions);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }

  try {
    if (req.session) {
      await req.session.logout("user");
    }
    return logoutSuccess()
  } catch {
    return logoutSuccess()
  }

};