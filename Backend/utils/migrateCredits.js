import User from "../models/user.js";
import CreditLedger from "../models/CreditLedger.js";
import { CREDITS_CONFIG } from "../config/creditsConfig.js";
import { getISTDateString, generateReferralCode } from "./credits.js";

/**
 * Migration routine:
 * Converts legacy users to the dual-bucket credit system.
 * - Migrates existing `credits` to `bonusCredits` (no loss).
 * - Gives initial `dailyCredits` (10 for users, 30 for admins).
 * - Assigns unique `referralCode` if missing.
 * - Writes a ledger entry for the migration.
 */
export async function runCreditsMigration() {
  try {
    const todayIST = getISTDateString();
    const users = await User.find({
      $or: [
        { dailyCredits: { $exists: false } },
        { bonusCredits: { $exists: false } },
        { referralCode: { $exists: false } },
      ],
    });

    if (users.length === 0) {
      console.log("[Migration] All users already migrated to dual-bucket credits.");
      return;
    }

    console.log(`[Migration] Migrating ${users.length} users to dual-bucket credits...`);

    for (const user of users) {
      const isAdmin = user.role === "admin";
      const dailyAllowance = isAdmin
        ? CREDITS_CONFIG.DAILY_REFILL.ADMIN
        : CREDITS_CONFIG.DAILY_REFILL.STANDARD;

      const currentTotal = typeof user.credits === "number" ? user.credits : 100;
      const initialBonus = Math.max(0, currentTotal);

      user.dailyCredits = user.dailyCredits ?? dailyAllowance;
      user.bonusCredits = user.bonusCredits ?? initialBonus;
      user.lastRefillDate = user.lastRefillDate || todayIST;
      user.credits = user.dailyCredits + user.bonusCredits;

      if (!user.referralCode) {
        user.referralCode = generateReferralCode();
      }

      await user.save();

      // Check if ledger already has migration row
      const existingLedger = await CreditLedger.findOne({
        userId: user._id,
        type: "migration",
      });

      if (!existingLedger) {
        await CreditLedger.create({
          userId: user._id,
          amount: initialBonus,
          bucket: "bonus",
          type: "migration",
          reason: `Migrated ${initialBonus} legacy credits to permanent bonus bucket`,
        });
      }
    }

    console.log(`[Migration] Successfully migrated ${users.length} users.`);
  } catch (err) {
    console.error("[Migration] Error running credits migration:", err);
  }
}
