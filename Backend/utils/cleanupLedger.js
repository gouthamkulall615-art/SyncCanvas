import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".config.env" });

import CreditLedger from "../models/CreditLedger.js";
import User from "../models/user.js";

export async function cleanupDuplicateLedger() {
  try {
    console.log("[LedgerCleanup] Checking for duplicate ledger entries...");
    const migrationEntries = await CreditLedger.find({ type: "migration" }).sort({ createdAt: 1 });

    const seenUsers = new Set();
    const toDeleteIds = [];

    for (const entry of migrationEntries) {
      const uid = entry.userId.toString();
      if (seenUsers.has(uid)) {
        toDeleteIds.push(entry._id);
      } else {
        seenUsers.add(uid);
      }
    }

    if (toDeleteIds.length > 0) {
      console.log(`[LedgerCleanup] Found ${toDeleteIds.length} duplicate migration records to remove.`);
      const delRes = await CreditLedger.deleteMany({ _id: { $in: toDeleteIds } });
      console.log(`[LedgerCleanup] Deleted ${delRes.deletedCount} duplicate entries.`);
    } else {
      console.log("[LedgerCleanup] No duplicate migration records found.");
    }

    // Also check if any user has legitimate spend/activity that was missing
    // e.g., if a user has bonusCredits: 95 instead of 100, add their actual spend entry if missing
    const users = await User.find({});
    for (const u of users) {
      const hasSpend = await CreditLedger.findOne({ userId: u._id, type: "spend" });
      const initialBonus = 100;
      if (!hasSpend && u.bonusCredits < initialBonus) {
        const diff = initialBonus - u.bonusCredits;
        console.log(`[LedgerCleanup] Adding recorded spend entry of -${diff} for user ${u.name} (${u.email})`);
        await CreditLedger.create({
          userId: u._id,
          amount: -diff,
          bucket: "bonus",
          type: "spend",
          reason: "AI Diagram Generation (bonus)",
          metadata: { note: "Historical generation activity" },
          createdAt: u.updatedAt || new Date(),
        });
      }
    }
  } catch (err) {
    console.error("[LedgerCleanup] Error during cleanup:", err);
  }
}

if (process.argv[1]?.includes("cleanupLedger.js")) {
  await mongoose.connect(process.env.MONGO_URL);
  await cleanupDuplicateLedger();
  process.exit(0);
}
