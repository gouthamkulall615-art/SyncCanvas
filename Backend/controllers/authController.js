import User from "../models/user.js";
import CreditLedger from "../models/CreditLedger.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CREDITS_CONFIG } from "../config/creditsConfig.js";
import {
  generateReferralCode,
  getISTDateString,
  syncDailyCredits,
} from "../utils/credits.js";

export const isEmailAdmin = (email) => {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  const configuredAdmin = (process.env.ADMIN_EMAIL || "gouthamkulall615@gmail.com").trim().toLowerCase();
  return (
    normalized === configuredAdmin ||
    normalized === "gouthamkulall615@gmail.com" ||
    normalized.startsWith("admin@") ||
    normalized.includes("+admin@")
  );
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "user already exits" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isAdmin = isEmailAdmin(email);
    const dailyAllowance = isAdmin
      ? CREDITS_CONFIG.DAILY_REFILL.ADMIN
      : CREDITS_CONFIG.DAILY_REFILL.STANDARD;

    // Resolve referredBy if referralCode provided
    let referredBy = null;
    if (referralCode && typeof referralCode === "string") {
      const inviter = await User.findOne({
        referralCode: referralCode.trim().toUpperCase(),
      });
      if (inviter) {
        referredBy = inviter._id;
      }
    }

    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      req.ip;

    const welcomeBonus = isAdmin
      ? CREDITS_CONFIG.WELCOME_BONUS.ADMIN
      : CREDITS_CONFIG.WELCOME_BONUS.STANDARD;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: isAdmin ? "admin" : "user",
      dailyCredits: dailyAllowance,
      bonusCredits: welcomeBonus,
      credits: dailyAllowance + welcomeBonus,
      lastRefillDate: getISTDateString(),
      referralCode: generateReferralCode(),
      referredBy,
      signupIp: clientIp,
    });

    if (welcomeBonus > 0) {
      await CreditLedger.create({
        userId: newUser._id,
        amount: welcomeBonus,
        bucket: "bonus",
        type: "onboarding",
        reason: "Welcome bonus on signup",
      }).catch((e) => console.error("Welcome bonus ledger error:", e));
    }

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "user registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        daily: newUser.dailyCredits,
        bonus: newUser.bonusCredits,
        credits: newUser.credits,
        referralCode: newUser.referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "invalid credentials" });
    }

    const isAdmin = isEmailAdmin(user.email) || user.role === "admin";
    if (isAdmin && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const syncedUser = await syncDailyCredits(user);

    const token = jwt.sign({ id: syncedUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const daily = syncedUser.dailyCredits || 0;
    const bonus = syncedUser.bonusCredits || 0;

    res.status(200).json({
      message: "login successfull",
      token,
      user: {
        id: syncedUser._id,
        name: syncedUser.name,
        email: syncedUser.email,
        role: syncedUser.role,
        daily,
        bonus,
        credits: daily + bonus,
        referralCode: syncedUser.referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// New Google Login Function
export const googleLogin = async (req, res) => {
  try {
    const { access_token, referralCode } = req.body;

    // Fetch user profile from Google
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    if (!response.ok) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const data = await response.json();
    const { name, email } = data;

    const isAdmin = isEmailAdmin(email);
    const dailyAllowance = isAdmin
      ? CREDITS_CONFIG.DAILY_REFILL.ADMIN
      : CREDITS_CONFIG.DAILY_REFILL.STANDARD;

    // Check if user already exists
    let user = await User.findOne({ email });

    // Create a new account if they are a first-time user
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + "A1!@";

      let referredBy = null;
      if (referralCode && typeof referralCode === "string") {
        const inviter = await User.findOne({
          referralCode: referralCode.trim().toUpperCase(),
        });
        if (inviter) referredBy = inviter._id;
      }

      const welcomeBonus = isAdmin
        ? CREDITS_CONFIG.WELCOME_BONUS.ADMIN
        : CREDITS_CONFIG.WELCOME_BONUS.STANDARD;

      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: isAdmin ? "admin" : "user",
        dailyCredits: dailyAllowance,
        bonusCredits: welcomeBonus,
        credits: dailyAllowance + welcomeBonus,
        lastRefillDate: getISTDateString(),
        referralCode: generateReferralCode(),
        referredBy,
      });

      if (welcomeBonus > 0) {
        await CreditLedger.create({
          userId: user._id,
          amount: welcomeBonus,
          bucket: "bonus",
          type: "onboarding",
          reason: "Welcome bonus on signup",
        }).catch((e) => console.error("Google welcome bonus ledger error:", e));
      }
    } else if (isAdmin && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const syncedUser = await syncDailyCredits(user);

    // Generate SyncCanvas JWT
    const token = jwt.sign({ id: syncedUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const daily = syncedUser.dailyCredits || 0;
    const bonus = syncedUser.bonusCredits || 0;

    res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        id: syncedUser._id,
        name: syncedUser.name,
        email: syncedUser.email,
        role: syncedUser.role,
        daily,
        bonus,
        credits: daily + bonus,
        referralCode: syncedUser.referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
