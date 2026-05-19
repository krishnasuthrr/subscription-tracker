import { Router } from "express";
import {
  createSubscription,
  deleteSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  getUserSubscriptions,
  updateSubscription,
} from "../controllers/subscription.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", getAllSubscriptions);

subscriptionRouter.get("/:id", getSubscriptionById);

subscriptionRouter.post("/", authorize, createSubscription);

subscriptionRouter.patch("/:id", authorize, updateSubscription);

subscriptionRouter.delete("/:id", authorize, deleteSubscription);

subscriptionRouter.get("/user/:id", authorize, getUserSubscriptions);

subscriptionRouter.get("/upcoming-renewals", (req, res) => {
  return res.status(200).json({ message: "GET upcoming renewals" });
});

export default subscriptionRouter;