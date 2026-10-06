import crypto from "crypto";
import User from "../models/user.js";
import CreditLedger from "../models/CreditLedger.js";
import { CREDITS_CONFIG } from "../config/creditsConfig.js";

/**
 * Custom error thrown when user has insufficient total credits.
 */
export class InsufficientCreditsError extends Error {
  constructor(userId, required, available) {
    super(
      `User ${userId} has insufficient credits (required: ${required}, available: ${available ?? 0})`
    );
    this.name = "InsufficientCreditsError";
    this.code = "INSUFFICIENT_CREDITS";
    this.userId = userId;
    this.required = required;
    this.available = available ?? 0;
  }
}

/**
 * Returns current date in "YYYY-MM-DD" formatted to Asia/Kolkata (IST).
 */
export function getISTDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CREDITS_CONFIG.TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Calculates remaining seconds until midnight in Asia/Kolkata (IST).
 */
export function getSecondsUntilReset() {
  const now = new Date();
  // Asia/Kolkata is UTC + 5:30 (330 minutes)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

  // Midnight tomorrow in IST
  const nextMidnightIST = new Date(nowIST);
  nextMidnightIST.setUTCHours(24, 0, 0, 0);

  const diffMs = nextMidnightIST.getTime() - nowIST.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Generates an 8-character unique alphanumeric referral code.
 */
export function generateReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Ensures legacy users are migrated, referral codes exist, and daily credits are lazily refilled.
 * Performs daily refill if lastRefillDate !== today (in IST).
 */
export async function syncDailyCredits(userDocOrId) {
  let user =
    userDocOrId && typeof userDocOrId === "object" && typeof userDocOrId.save === "function"
      ? userDocOrId
      : await User.findById(userDocOrId);

  if (!user) return null;

  const todayIST = getISTDateString();
  const isAdmin = user.role === "admin";
  const dailyAllowance = isAdmin
    ? CREDITS_CONFIG.DAILY_REFILL.ADMIN
    : CREDITS_CONFIG.DAILY_REFILL.STANDARD;

  let needsSave = false;

  // 1. One-time Migration for legacy users
  if (user.dailyCredits === undefined || user.bonusCredits === undefined) {
    const legacyTotal = typeof user.credits === "number" ? user.credits : 100;
    user.bonusCredits = Math.max(0, legacyTotal);
    user.dailyCredits = dailyAllowance;
    user.lastRefillDate = todayIST;
    user.credits = user.dailyCredits + user.bonusCredits;
    needsSave = true;

    // Record migration in ledger
    await CreditLedger.create({
      userId: user._id,
      amount: user.bonusCredits,
      bucket: "bonus",
      type: "migration",
      reason: "Migrated legacy credits to bonus bucket",
    }).catch((e) => console.error("Migration ledger error:", e));
  }

  // 2. Ensure referral code exists
  if (!user.referralCode) {
    user.referralCode = generateReferralCode();
    needsSave = true;
  }

  // 3. Lazy Daily Refill (if date changed in IST)
  if (user.lastRefillDate !== todayIST) {
    const oldDaily = user.dailyCredits || 0;
    user.dailyCredits = dailyAllowance;
    user.lastRefillDate = todayIST;
    user.credits = user.dailyCredits + (user.bonusCredits || 0);
    needsSave = true;

    // Record daily refill in ledger
    await CreditLedger.create({
      userId: user._id,
      amount: dailyAllowance,
      bucket: "daily",
      type: "daily_refill",
      reason: `Daily refill (${dailyAllowance} credits)`,
      metadata: { previousDaily: oldDaily, date: todayIST },
    }).catch((e) => console.error("Daily refill ledger error:", e));
  }

  if (needsSave) {
    const updated = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          dailyCredits: user.dailyCredits,
          bonusCredits: user.bonusCredits,
          credits: user.credits,
          lastRefillDate: user.lastRefillDate,
          referralCode: user.referralCode,
        },
      },
      { new: true }
    );
    if (updated) user = updated;
  }

  return user;
}

/**
 * Atomically spend credits using MongoDB conditional aggregation pipeline.
 * Order of spend: dailyCredits first, then bonusCredits.
 * Balance can never go negative.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {number} amount
 * @param {string} reason
 * @param {object} metadata
 * @returns {Promise<{ user: Document, spentDaily: number, spentBonus: number }>}
 */
export async function spendCredits(userId, amount, reason = "AI Diagram Generation", metadata = {}) {
  // First ensure daily credits are up-to-date for today
  await syncDailyCredits(userId);

  // Single atomic conditional update pipeline:
  // Fails if (dailyCredits + bonusCredits) < amount
  const filter = {
    _id: userId,
    $expr: {
      $gte: [
        {
          $add: [
            { $ifNull: ["$dailyCredits", 0] },
            { $ifNull: ["$bonusCredits", 0] },
          ],
        },
        amount,
      ],
    },
  };

  const updatePipeline = [
    {
      $set: {
        _tempSpentDaily: {
          $cond: [
            { $gte: [{ $ifNull: ["$dailyCredits", 0] }, amount] },
            amount,
            { $ifNull: ["$dailyCredits", 0] },
          ],
        },
        _tempSpentBonus: {
          $cond: [
            { $gte: [{ $ifNull: ["$dailyCredits", 0] }, amount] },
            0,
            { $subtract: [amount, { $ifNull: ["$dailyCredits", 0] }] },
          ],
        },
        dailyCredits: {
          $cond: [
            { $gte: [{ $ifNull: ["$dailyCredits", 0] }, amount] },
            { $subtract: [{ $ifNull: ["$dailyCredits", 0] }, amount] },
            0,
          ],
        },
        bonusCredits: {
          $cond: [
            { $gte: [{ $ifNull: ["$dailyCredits", 0] }, amount] },
            { $ifNull: ["$bonusCredits", 0] },
            {
              $subtract: [
                { $ifNull: ["$bonusCredits", 0] },
                { $subtract: [amount, { $ifNull: ["$dailyCredits", 0] }] },
              ],
            },
          ],
        },
      },
    },
    {
      $set: {
        credits: { $add: ["$dailyCredits", "$bonusCredits"] },
      },
    },
  ];

  const updatedUser = await User.findOneAndUpdate(filter, updatePipeline, {
    returnDocument: "after",
    updatePipeline: true,
  });

  if (!updatedUser) {
    const user = await User.findById(userId);
    const available = (user?.dailyCredits || 0) + (user?.bonusCredits || 0);
    throw new InsufficientCreditsError(userId, amount, available);
  }

  const spentDaily = updatedUser._tempSpentDaily || 0;
  const spentBonus = updatedUser._tempSpentBonus || 0;

  // Clean up temporary calculation fields asynchronously
  User.updateOne(
    { _id: userId },
    { $unset: { _tempSpentDaily: 1, _tempSpentBonus: 1 } }
  ).exec().catch(() => {});

  // Record ledger rows for the spend
  const ledgerEntries = [];
  if (spentDaily > 0) {
    ledgerEntries.push({
      userId,
      amount: -spentDaily,
      bucket: "daily",
      type: "spend",
      reason: `${reason} (daily)`,
      metadata,
    });
  }
  if (spentBonus > 0) {
    ledgerEntries.push({
      userId,
      amount: -spentBonus,
      bucket: "bonus",
      type: "spend",
      reason: `${reason} (bonus)`,
      metadata,
    });
  }

  if (ledgerEntries.length > 0) {
    CreditLedger.insertMany(ledgerEntries).catch((e) =>
      console.error("Ledger insert error:", e)
    );
  }

  return {
    user: updatedUser,
    spentDaily,
    spentBonus,
  };
}

/**
 * Refund credits back to user if generation failed.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {{ daily?: number, bonus?: number }} amounts
 * @param {string} reason
 */
export async function refundCredits(
  userId,
  amounts = { daily: 0, bonus: 0 },
  reason = "Refund for failed AI generation"
) {
  const daily = Number(amounts.daily) || 0;
  const bonus = Number(amounts.bonus) || 0;
  const total = daily + bonus;

  if (total <= 0) return null;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        dailyCredits: daily,
        bonusCredits: bonus,
        credits: total,
      },
    },
    { new: true }
  );

  const ledgerEntries = [];
  if (daily > 0) {
    ledgerEntries.push({
      userId,
      amount: daily,
      bucket: "daily",
      type: "refund",
      reason: `${reason} (daily)`,
    });
  }
  if (bonus > 0) {
    ledgerEntries.push({
      userId,
      amount: bonus,
      bucket: "bonus",
      type: "refund",
      reason: `${reason} (bonus)`,
    });
  }

  if (ledgerEntries.length > 0) {
    CreditLedger.insertMany(ledgerEntries).catch((e) =>
      console.error("Refund ledger error:", e)
    );
  }

  return updatedUser;
}

/**
 * Checks and awards referral rewards after the referee's first successful AI generation.
 * Both inviter and invitee receive 30 bonus credits.
 */
export async function processFirstGenerationReferral(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.referredBy || user.referralRewarded) return;

    const inviterId = user.referredBy;
    if (inviterId.toString() === user._id.toString()) return; // Prevent self-referral

    const inviter = await User.findById(inviterId);
    if (!inviter) return;

    const rewardConfig = CREDITS_CONFIG.ACTIONS.REFERRAL;
    const inviterRewardCount = inviter.referralRewardCount || 0;

    // 1. Reward inviter (if under max 10 rewarded referrals)
    if (inviterRewardCount < rewardConfig.MAX_REWARDS_PER_USER) {
      await User.findByIdAndUpdate(inviterId, {
        $inc: {
          bonusCredits: rewardConfig.REWARD_INVITER,
          credits: rewardConfig.REWARD_INVITER,
          referralRewardCount: 1,
        },
      });

      await CreditLedger.create({
        userId: inviterId,
        amount: rewardConfig.REWARD_INVITER,
        bucket: "bonus",
        type: "referral",
        reason: `Referral bonus: invited friend created their first diagram`,
        metadata: { refereeId: user._id },
      });
    }

    // 2. Reward referee (invitee)
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        bonusCredits: rewardConfig.REWARD_INVITEE,
        credits: rewardConfig.REWARD_INVITEE,
      },
      $set: { referralRewarded: true },
    });

    await CreditLedger.create({
      userId: user._id,
      amount: rewardConfig.REWARD_INVITEE,
      bucket: "bonus",
      type: "referral",
      reason: `Welcome bonus: completed first AI diagram generation`,
      metadata: { inviterId: inviter._id },
    });
  } catch (err) {
    console.error("Error in processFirstGenerationReferral:", err);
  }
}
