import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "A user must have a password"],
      minlength: [8, "A password must have atleast 8 characters"],
      select: false,
    },

    credits: {
      type: Number,
      default: 100,
    },

    dailyCredits: {
      type: Number,
      default: 10,
    },

    bonusCredits: {
      type: Number,
      default: 0,
    },

    lastRefillDate: {
      type: String,
      default: null, // "YYYY-MM-DD" in IST
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralRewarded: {
      type: Boolean,
      default: false,
    },

    referralRewardCount: {
      type: Number,
      default: 0, // Number of invited users who rewarded this user (max 10)
    },

    onboardingClaimed: {
      type: Boolean,
      default: false,
    },

    sharedDiagrams: [
      {
        diagramId: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    ratings: [
      {
        rating: { type: Number, required: true },
        note: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    streakCount: {
      type: Number,
      default: 0,
    },

    lastStreakDate: {
      type: String,
      default: null, // "YYYY-MM-DD"
    },

    streakClaimed: {
      type: Boolean,
      default: false,
    },

    signupIp: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    hostedRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
    accessibleRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
