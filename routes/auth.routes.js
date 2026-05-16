import { Router } from "express";

const authRouter = Router()

authRouter.post("/sign-up", (req, res) => {
  return res.status(200).json({ message: "Sign Up Route" });
});

authRouter.post("/sign-in", (req, res) => {
  return res.status(200).json({ message: "Sign In Route" });
});

authRouter.post("/sign-out", (req, res) => {
  return res.status(200).json({ message: "Sign Out Route" });
});

export default authRouter;