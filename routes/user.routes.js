import { Router } from "express";

const userRouter = Router()

userRouter.get("/", (req, res) => {
  return res.status(200).json({ message: "GET all users" });
});

userRouter.get("/:id", (req, res) => {
  return res.status(200).json({ message: "GET a user by ID" });
});

userRouter.post("/", (req, res) => {
  return res.status(200).json({ message: "CREATE new user" });
});

userRouter.put("/:id", (req, res) => {
  return res.status(200).json({ message: "UPDATE a user" });
});

userRouter.delete("/:id", (req, res) => {
  return res.status(200).json({ message: "DELETE a user" });
});

export default userRouter;