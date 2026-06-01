import express from "express"
import cookieParser from "cookie-parser"

import { PORT } from "./config/env.js"

import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import workflowRouter from "./routes/workflow.routes.js"
import testRouter from "./routes/test.routes.js";

import connectDB from "./db/db.js"
import errorMiddleware from "./middlewares/error.middleware.js"
import arcjetMiddlware from "./middlewares/arcjet.middleware.js"

const app = express()

app.use(express.json({ limit: "50kb" }))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(arcjetMiddlware)

app.get("/", (req, res) => {
    res.send("Welcome to Subscription Tracker API")
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/workflows", workflowRouter)

app.use("/api/test", testRouter)

app.use(errorMiddleware);  // put after routes to work with 'next'

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`)
    await connectDB()
})

export default app; 