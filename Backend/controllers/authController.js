import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "user already exits" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isAdmin = isEmailAdmin(email);
    const totalCredits = isAdmin ? 300 : 100;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: isAdmin ? "admin" : "user",
      credits: totalCredits,
    });

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
        credits: newUser.credits,
        totalCredits,
        usedCredits: 0,
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "login successfull",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: currentCredits,
        totalCredits,
        usedCredits,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// New Google Login Function
export const googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

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
    const defaultCredits = isAdmin ? 300 : 100;

    // Check if user already exists
    let user = await User.findOne({ email });

    // Create a new account if they are a first-time user
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + "A1!@";

      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: isAdmin ? "admin" : "user",
        credits: defaultCredits,
      });
    } else if (isAdmin) {
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

    // Generate SyncCanvas JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: currentCredits,
        totalCredits,
        usedCredits,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
