import { Router } from "express";
import { getUser, getUsers } from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.get("/", getUsers);

userRouter.get("/:id", authorize, getUser);

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