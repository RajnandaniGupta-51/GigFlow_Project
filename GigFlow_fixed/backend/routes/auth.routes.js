import express from "express";
import { login, register, logout } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json({ user });
});

router.post("/logout", logout);

export default router;
