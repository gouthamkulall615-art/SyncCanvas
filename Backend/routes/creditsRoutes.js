import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import User from "../models/user.js";
import CreditLedger from "../models/CreditLedger.js";
import { CREDITS_CONFIG } from "../config/creditsConfig.js";
import {
  syncDailyCredits,
  getSecondsUntilReset,
  getISTDateString,
} from "../utils/credits.js";

const router = express.Router();

/**
 * Helper to compute start of current IST day as a JS Date object.
 */
function getStartOfTodayIST() {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  nowIST.setUTCHours(0, 0, 0, 0);
  return new Date(nowIST.getTime() - IST_OFFSET_MS);
}

/**
 * GET /api/credits
 * Returns user credit buckets, secondsUntilReset, referral stats, and earn action status.
 */
router.get("/", protect, async (req, res) => {
  try {
    const user = await syncDailyCredits(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const secondsUntilReset = getSecondsUntilReset();
    const startOfTodayIST = getStartOfTodayIST();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Share stats in past 7 days
    const sharesThisWeek = await CreditLedger.countDocuments({
      userId: user._id,
      type: "share",
      createdAt: { $gte: oneWeekAgo },
    });

    // 2. Ratings submitted today in IST
    const ratingsToday = await CreditLedger.countDocuments({
      userId: user._id,
      type: "rating",
      createdAt: { $gte: startOfTodayIST },
    });

    // 3. Referral stats
    const friendsJoinedCount = await User.countDocuments({
      referredBy: user._id,
    });
    const referralCreditsEarned =
      (user.referralRewardCount || 0) *
      CREDITS_CONFIG.ACTIONS.REFERRAL.REWARD_INVITER;

    const earnStatus = {
      referral: {
        reward: CREDITS_CONFIG.ACTIONS.REFERRAL.REWARD_INVITER,
        maxRewarded: CREDITS_CONFIG.ACTIONS.REFERRAL.MAX_REWARDS_PER_USER,
        rewardedCount: user.referralRewardCount || 0,
        friendsJoined: friendsJoinedCount,
        available:
          (user.referralRewardCount || 0) <
          CREDITS_CONFIG.ACTIONS.REFERRAL.MAX_REWARDS_PER_USER,
      },
      share: {
        reward: CREDITS_CONFIG.ACTIONS.SHARE.REWARD,
        claimedThisWeek: sharesThisWeek,
        maxPerWeek: CREDITS_CONFIG.ACTIONS.SHARE.MAX_PER_WEEK,
        remainingThisWeek: Math.max(
          0,
          CREDITS_CONFIG.ACTIONS.SHARE.MAX_PER_WEEK - sharesThisWeek
        ),
        available:
          sharesThisWeek < CREDITS_CONFIG.ACTIONS.SHARE.MAX_PER_WEEK,
      },
      rating: {
        reward: CREDITS_CONFIG.ACTIONS.RATING.REWARD,
        claimedToday: ratingsToday,
        maxPerDay: CREDITS_CONFIG.ACTIONS.RATING.MAX_PER_DAY,
        remainingToday: Math.max(
          0,
          CREDITS_CONFIG.ACTIONS.RATING.MAX_PER_DAY - ratingsToday
        ),
        available:
          ratingsToday < CREDITS_CONFIG.ACTIONS.RATING.MAX_PER_DAY,
      },
      onboarding: {
        reward: CREDITS_CONFIG.ACTIONS.ONBOARDING.REWARD,
        claimed: !!user.onboardingClaimed,
        available: !user.onboardingClaimed,
      },
      streak: {
        reward: CREDITS_CONFIG.ACTIONS.STREAK.REWARD,
        requiredDays: CREDITS_CONFIG.ACTIONS.STREAK.REQUIRED_DAYS,
        currentDays: Math.min(
          CREDITS_CONFIG.ACTIONS.STREAK.REQUIRED_DAYS,
          user.streakCount || 1
        ),
        claimed: !!user.streakClaimed,
        available:
          (user.streakCount || 1) >=
            CREDITS_CONFIG.ACTIONS.STREAK.REQUIRED_DAYS && !user.streakClaimed,
      },
    };

    const daily = user.dailyCredits || 0;
    const bonus = user.bonusCredits || 0;
    const total = daily + bonus;

    return res.status(200).json({
      daily,
      bonus,
      total,
      secondsUntilReset,
      referralCode: user.referralCode,
      referralStats: {
        friendsJoined: friendsJoinedCount,
        creditsEarned: referralCreditsEarned,
      },
      earnStatus,
      isAdmin: user.role === "admin",
    });
  } catch (err) {
    console.error("GET /api/credits error:", err);
    return res.status(500).json({ error: "Failed to fetch credit details" });
  }
});

/**
 * GET /api/credits/ledger
 * Paginated credit ledger history.
 */
router.get("/ledger", protect, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const cursor = req.query.cursor; // ISO date string or timestamp

    const query = { userId: req.user._id };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const items = await CreditLedger.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? pageItems[pageItems.length - 1].createdAt
        : null;

    return res.status(200).json({
      items: pageItems,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("GET /api/credits/ledger error:", err);
    return res.status(500).json({ error: "Failed to fetch credit history" });
  }
});

/**
 * POST /api/credits/claim/:action
 * Server-side validated and idempotent reward claiming.
 */
router.post("/claim/:action", protect, async (req, res) => {
  try {
    const { action } = req.params;
    const user = await syncDailyCredits(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. SHARE PUBLIC DIAGRAM
    if (action === "share") {
      const { diagramId } = req.body;
      if (!diagramId || typeof diagramId !== "string") {
        return res
          .status(400)
          .json({ error: "diagramId is required to claim a share reward." });
      }

      // Check if this diagram was already rewarded for this user
      const existing = await CreditLedger.findOne({
        userId: user._id,
        type: "share",
        "metadata.diagramId": diagramId,
      });
      if (existing) {
        return res
          .status(400)
          .json({ error: "Reward already claimed for this diagram." });
      }

      // Check weekly cap (max 3/week)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const sharesThisWeek = await CreditLedger.countDocuments({
        userId: user._id,
        type: "share",
        createdAt: { $gte: oneWeekAgo },
      });

      if (sharesThisWeek >= CREDITS_CONFIG.ACTIONS.SHARE.MAX_PER_WEEK) {
        return res.status(400).json({
          error: `Weekly share reward limit reached (${CREDITS_CONFIG.ACTIONS.SHARE.MAX_PER_WEEK} per week).`,
        });
      }

      const rewardAmount = CREDITS_CONFIG.ACTIONS.SHARE.REWARD;
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: { bonusCredits: rewardAmount, credits: rewardAmount },
          $push: { sharedDiagrams: { diagramId, createdAt: new Date() } },
        },
        { new: true }
      );

      await CreditLedger.create({
        userId: user._id,
        amount: rewardAmount,
        bucket: "bonus",
        type: "share",
        reason: "Shared diagram publicly",
        metadata: { diagramId },
      });

      return res.status(200).json({
        message: `Claimed +${rewardAmount} bonus credits!`,
        bonus: updatedUser.bonusCredits,
        total: (updatedUser.dailyCredits || 0) + updatedUser.bonusCredits,
      });
    }

    // 2. RATE AN AI RESULT
    if (action === "rating") {
      const { rating, note } = req.body;
      const numericRating = Number(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return res
          .status(400)
          .json({ error: "A valid rating between 1 and 5 is required." });
      }

      // Check daily cap (max 5/day in IST)
      const startOfTodayIST = getStartOfTodayIST();
      const ratingsToday = await CreditLedger.countDocuments({
        userId: user._id,
        type: "rating",
        createdAt: { $gte: startOfTodayIST },
      });

      if (ratingsToday >= CREDITS_CONFIG.ACTIONS.RATING.MAX_PER_DAY) {
        return res.status(400).json({
          error: `Daily rating reward limit reached (${CREDITS_CONFIG.ACTIONS.RATING.MAX_PER_DAY} per day).`,
        });
      }

      const rewardAmount = CREDITS_CONFIG.ACTIONS.RATING.REWARD;
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: { bonusCredits: rewardAmount, credits: rewardAmount },
          $push: {
            ratings: {
              rating: numericRating,
              note: String(note || "").slice(0, 500),
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );

      await CreditLedger.create({
        userId: user._id,
        amount: rewardAmount,
        bucket: "bonus",
        type: "rating",
        reason: "Rated AI diagram generation",
        metadata: {
          rating: numericRating,
          note: String(note || "").slice(0, 500),
        },
      });

      return res.status(200).json({
        message: `Claimed +${rewardAmount} bonus credits!`,
        bonus: updatedUser.bonusCredits,
        total: (updatedUser.dailyCredits || 0) + updatedUser.bonusCredits,
      });
    }

    // 3. ONBOARDING (FIRST DIAGRAM CREATED)
    if (action === "onboarding") {
      if (user.onboardingClaimed) {
        return res
          .status(400)
          .json({ error: "Onboarding reward already claimed." });
      }

      const rewardAmount = CREDITS_CONFIG.ACTIONS.ONBOARDING.REWARD;
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: { bonusCredits: rewardAmount, credits: rewardAmount },
          $set: { onboardingClaimed: true },
        },
        { new: true }
      );

      await CreditLedger.create({
        userId: user._id,
        amount: rewardAmount,
        bucket: "bonus",
        type: "onboarding",
        reason: "Created first diagram (Onboarding)",
      });

      return res.status(200).json({
        message: `Claimed +${rewardAmount} bonus credits!`,
        bonus: updatedUser.bonusCredits,
        total: (updatedUser.dailyCredits || 0) + updatedUser.bonusCredits,
      });
    }

    // 4. 7-DAY STREAK
    if (action === "streak") {
      if (user.streakClaimed) {
        return res
          .status(400)
          .json({ error: "Streak reward already claimed for this milestone." });
      }

      const currentStreak = user.streakCount || 1;
      if (currentStreak < CREDITS_CONFIG.ACTIONS.STREAK.REQUIRED_DAYS) {
        return res.status(400).json({
          error: `7-day streak required. Current streak: ${currentStreak} days.`,
        });
      }

      const rewardAmount = CREDITS_CONFIG.ACTIONS.STREAK.REWARD;
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: { bonusCredits: rewardAmount, credits: rewardAmount },
          $set: { streakClaimed: true },
        },
        { new: true }
      );

      await CreditLedger.create({
        userId: user._id,
        amount: rewardAmount,
        bucket: "bonus",
        type: "streak",
        reason: "7-day activity streak completed",
      });

      return res.status(200).json({
        message: `Claimed +${rewardAmount} bonus credits!`,
        bonus: updatedUser.bonusCredits,
        total: (updatedUser.dailyCredits || 0) + updatedUser.bonusCredits,
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("POST /api/credits/claim error:", err);
    return res.status(500).json({ error: "Failed to claim reward" });
  }
});

/**
 * POST /api/credits/upgrade
 * Refill/upgrade bonus credits directly.
 */
router.post("/upgrade", protect, async (req, res) => {
  try {
    const user = await syncDailyCredits(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const refillAmount = req.body?.credits || 100;
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { bonusCredits: refillAmount, credits: refillAmount },
      },
      { new: true }
    );

    await CreditLedger.create({
      userId: user._id,
      amount: refillAmount,
      bucket: "bonus",
      type: "daily_refill", // recorded as plan refill
      reason: `Purchased/upgraded +${refillAmount} bonus credits`,
    });

    const daily = updatedUser.dailyCredits || 0;
    const bonus = updatedUser.bonusCredits || 0;

    return res.status(200).json({
      message: "Plan upgraded successfully! Bonus credits added.",
      daily,
      bonus,
      total: daily + bonus,
    });
  } catch (err) {
    console.error("POST /api/credits/upgrade error:", err);
    return res.status(500).json({ error: "Failed to upgrade credits" });
  }
});

export default router;
