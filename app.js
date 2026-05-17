import express from "express"
import cookieParser from "cookie-parser"

import { PORT } from "./config/env.js"

import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

import connectDB from "./db/db.js"
import errorMiddleware from "./middlewares/error.middleware.js"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("Welcome to Subscription Tracker API")
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);

app.use(errorMiddleware);  // put after routes to work with 'next'

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`)
    await connectDB()
})

export default app; 