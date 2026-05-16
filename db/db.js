import mongoose from "mongoose";
import { MONGO_URI, NODE_ENV } from "../config/env.js";

export default async function connectDB() {
    
    try {
        
        await mongoose.connect(MONGO_URI)
        console.log(`Database connected successfully in ${NODE_ENV} mode`)

    } catch (error) {
        console.error("Database connection error: ", error)

        process.exit(1)
    }

}