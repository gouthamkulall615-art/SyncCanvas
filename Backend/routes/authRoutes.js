import express from "express";
import {
  loginUser,
  registerUser,
  googleLogin,
  isEmailAdmin,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import User from "../models/user.js";

const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isAdmin = isEmailAdmin(user.email) || user.role === "admin";
    if (isAdmin) {
      let changed = false;
      if (user.role !== "admin") {
        user.role = "admin";
        changed = true;
      }
      if (user.credits == null || user.credits < 300) {
        user.credits = 300;
        changed = true;
      }
      if (changed) await user.save();
    }

    const totalCredits = (user.role === "admin" || isAdmin) ? 300 : 100;
    const currentCredits = user.credits != null ? user.credits : totalCredits;
    const usedCredits = Math.max(0, totalCredits - currentCredits);

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      credits: currentCredits,
      totalCredits,
      usedCredits,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
