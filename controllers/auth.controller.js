import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

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
            expiresIn: JWT_EXPIRES_IN,
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

        const token = jwt.sign(
          {
            userId: user._id,
          },
          JWT_SECRET,
          {
            expiresIn: JWT_EXPIRES_IN,
          },
        );

        res.status(200).json({
            success: true,
            message: "User Logged In Successfully",
            data: {
                id: user._id,
                token
            }
        })

    } catch (error) {
        next(error)
    }

};

// export const signOut = async (req, res, next) => {};