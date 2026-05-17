import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/env.js";
import userModel from "../models/user.model.js";

const authorize = async (req, res, next) => {

    try {
        
        let token;

        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1]
        }

        if(!token) return res.status(401).json({ message: "Unauthorized" })

        const decoded = jwt.verify(token, JWT_SECRET)

        const user = await userModel.findById(decoded.userId)

        if(!user) return res.status(401).json({ message: "Unauthorized" })

        req.user = user

        next()

    } catch (error) {
        return res.status(401).json({ message: "Unauthorized", error: error.message })
    }

}

export default authorize;