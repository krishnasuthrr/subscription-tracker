import { Router } from "express";
import { sendReminders } from "../controllers/upstash.controller.js";

const workflowRouter = Router()

workflowRouter.post("/subscription/reminder", sendReminders)

export default workflowRouter