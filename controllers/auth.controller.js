import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from 'node:crypto';
import jwt from "jsonwebtoken"
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite"

import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import { JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction(); // sessions for atomic DB operations
    // all db operations in MongoDB transactions MUST contain the session object
    try {
        
        const { name, email, password } = req.body

        const existingUser = await userModel.findOne({ email }).session(session) // RUD queries can be chained with .session(session)

        if(existingUser) {
            const error = new Error("User already exists")
            error.statusCode = 409
            throw error
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const users = await userModel.create([{ name, email, password: hashedPassword }], { session }) // Create and Save queries cannot be chained, only require passing session object as second arg

        const token = jwt.sign(
          {
            userId: users[0]._id,
          },
          JWT_SECRET,
          {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
          },
        );

        await session.commitTransaction()
        session.endSession()

        res.status(201).json({
            success: true,
            message: "User Created Successfully",
            data: {
                userId: users[0]._id,
                token
            }
        })

    } catch (error) {
        await session.abortTransaction();
        session.endSession()
        next(error)
    }
};

export const signIn = async (req, res, next) => {

    try {
        
        const { email, password } = req.body;

        const user = await userModel.findOne({ email })

        if(!user) {
            const error = new Error("User not Found")
            error.statusCode = 404
            throw error
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if(!isPasswordValid) {
            const error = new Error("Incorrect Password")
            error.statusCode = 401
            throw error
        }

        const userAgent = req.headers["user-agent"];
        const parsedUA = new UAParser(userAgent).getResult()
        const ip = geoip.lookup(req.ip)

        const sessionId = new mongoose.Types.ObjectId()

        const refreshToken = jwt.sign(
          {
            userId: user._id,
            sessionId: sessionId.toString()
          },
          JWT_SECRET,
          {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
          },
        );

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

        const session = await sessionModel.create({
          _id: sessionId,
          user: user._id,
          refreshTokenHash,
          ipAddress: req.ip,
          userAgent: userAgent,
          device: {
            browser: parsedUA.browser.name,
            type: parsedUA.device.type,
            os: parsedUA.os.name
              ? `${parsedUA.os.name} ${parsedUA.os.version || ""}`.trim()
              : null,
            location: {
              country: ip?.country || null,
              region: ip?.region || null,
              city: ip?.city || null,
            },
          },
        });

        const accessToken = jwt.sign(
          {
            userId: user._id,
          },
          JWT_SECRET,
          {
            expiresIn: JWT_ACCESS_EXPIRES_IN,
          },
        );

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/api/v1/auth/refresh",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        };

        res.cookie("refreshToken", refreshToken, cookieOptions)

        res.status(200).json({
            success: true,
            message: "User Logged In Successfully",
            data: {
                id: user._id,
                session,
                accessToken
            }
        })

    } catch (error) {
        next(error)
    }

};

// export const signOut = async (req, res, next) => {};