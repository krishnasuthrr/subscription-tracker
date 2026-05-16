import { Router } from "express";

const subscriptionRouter = Router();

subscriptionRouter.get("/", (req, res) => {
  return res.status(200).json({ message: "GET all Subscriptions" });
});

subscriptionRouter.get("/:id", (req, res) => {
  return res.status(200).json({ message: "GET a subscription" });
});

subscriptionRouter.post("/", (req, res) => {
  return res.status(200).json({ message: "CREATE a subscription" });
});

subscriptionRouter.put("/:id", (req, res) => {
  return res.status(200).json({ message: "UPDATE a subscription" });
});

subscriptionRouter.delete("/:id", (req, res) => {
  return res.status(200).json({ message: "DELETE a subscription" });
});

subscriptionRouter.get("/user/:id", (req, res) => {
  return res.status(200).json({ message: "GET all user subscriptions" });
});

subscriptionRouter.get("/upcoming-renewals", (req, res) => {
  return res.status(200).json({ message: "GET upcoming renewals" });
});

export default subscriptionRouter;