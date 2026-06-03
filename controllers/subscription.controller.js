import { z } from "zod";
import subscriptionModel from "../models/subscription.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";

const createSubscriptionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, "name must be at least 5 characters")
    .max(100, "name must be at most 100 characters"),
  price: z.number().min(0, "price must be greater than or equal to 0"),
  currency: z.enum(["USD", "INR", "EUR"]).default("INR"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  category: z.enum([
    "entertainment",
    "sports",
    "music",
    "education",
    "news",
    "shopping",
    "other",
  ]),
  paymentMethod: z.string().trim().min(1, "paymentMethod is required"),
  startDate: z.coerce
    .date()
    .refine((date) => date <= new Date(), {
      message: "startDate must be in the past or present",
    }),
}).strict()

const updateSubscriptionSchema = createSubscriptionSchema
  .omit({
    startDate: true, // startDate must not be updated
  })
  .partial() // all fields optional with min 1 field
  

export const createSubscription = async (req, res, next) => {
  try {
    const validatedBody = createSubscriptionSchema.parse(req.body);

    const subscription = await subscriptionModel.create({
      ...validatedBody,
      user: req.user._id,
    });

    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
      body: {
        subscriptionId: subscription.id,
      },
      headers: {
        "content-type": "application/json",
      },
      retries: 0,
    });

    return res.status(201).json({
        success: true,
        message: "Subscription Created",
        subscription,
        workflowRunId,
      });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationMessage = z.flattenError(error)
      console.log(validationMessage)
      
      return res.status(400).json({
        success: false,
        message: "Subscription input validation error",
        errors: validationMessage
      })
    }
    next(error);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      const error = new Error("Unauthorized User");
      error.statusCode = 401;
      throw error;
    }

    const subscriptions = await subscriptionModel.find({ user: req.user._id });

    if (subscriptions.length <= 0) {
      return res
        .status(200)
        .json({ message: "No Subscriptions found for this User" });
    }

    return res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionModel.find();

    if (subscriptions.length <= 0) {
      return res.status(200).json({ message: "No Subscriptions found" });
    }

    return res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await subscriptionModel.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      const error = new Error("Invalid Input")
      error.statusCode = 400
      throw error
    }

    const subscription = await subscriptionModel.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (!subscription.user.equals(req.user._id)) {
      const error = new Error("Access forbidden");
      error.statusCode = 403;
      throw error;
    }

    const validatedBody = updateSubscriptionSchema.parse(req.body);

    subscription.set(validatedBody);

    const updatedSubscription = await subscription.save();

    return res.status(200).json({ success: true, updatedSubscription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationMessage = z.flattenError(error);

      return res.status(400).json({
        success: false,
        message: "Subscription input validation error",
        errors: validationMessage,
      });
    }
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionModel.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Invalid Subscription Id");
      error.statusCode = 400;
      throw error;
    }

    if (!subscription.user.equals(req.user._id)) {
      const error = new Error("Unauthorized User");
      error.statusCode = 401;
      throw error;
    }

    await subscription.deleteOne();

    res.status(200).json({ success: true, message: "Subscription deleted successfully" });
  } catch (error) {
    next(error);
  }
};
