import User from "../models/user.js";

/**
 * Custom error thrown when a user lacks sufficient credits for an operation.
 * Carries a recognisable `code` so callers can distinguish it from generic
 * errors without relying on string matching.
 */
export class InsufficientCreditsError extends Error {
  constructor(userId, required, available) {
    super(
      `User ${userId} has insufficient credits (required: ${required}, available: ${available ?? "unknown"})`,
    );
    this.name = "InsufficientCreditsError";
    this.code = "INSUFFICIENT_CREDITS";
    this.userId = userId;
    this.required = required;
    this.available = available;
  }
}

/**
 * Atomically check-and-decrement a user's credits in a single query.
 *
 * Uses `findOneAndUpdate` with a `credits >= amount` guard so the
 * balance can never go negative — no read-then-write race condition.
 *
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @param {number} amount  Positive integer of credits to spend.
 * @returns {Promise<import("mongoose").Document>} The updated user document.
 * @throws {InsufficientCreditsError} If the user doesn't have enough credits.
 */
export async function spendCredits(userId, amount) {
  const filter = { _id: userId, credits: { $gte: amount } };
  const update = { $inc: { credits: -amount } };
  console.log("spendCredits filter:", JSON.stringify(filter), "update:", JSON.stringify(update));

  let updatedUser = await User.findOneAndUpdate(
    filter,
    update,
    { returnDocument: "after" },
  );

  if (!updatedUser) {
    // Check whether user exists and what's in the document
    const user = await User.findById(userId).select("credits");
    if (!user) {
      throw new Error(`spendCredits failed: user ${userId} not found`);
    }

    // Legacy document check: if the document was created before `credits` was added
    // to the schema, `credits` does not exist in MongoDB BSON (missing field).
    // In MongoDB, { credits: { $gte: amount } } evaluates to false for missing fields,
    // even though Mongoose hydrated user.credits with default 100.
    const rawUser = await User.collection.findOne(
      { _id: user._id },
      { projection: { credits: 1 } },
    );

    if (rawUser && rawUser.credits === undefined) {
      const defaultCredits = 100;
      if (defaultCredits >= amount) {
        updatedUser = await User.findOneAndUpdate(
          { _id: userId, credits: { $exists: false } },
          { $set: { credits: defaultCredits - amount } },
          { returnDocument: "after" },
        );
        if (updatedUser) {
          return updatedUser;
        }
      }
    }

    throw new InsufficientCreditsError(
      userId,
      amount,
      user?.credits,
    );
  }

  return updatedUser;
}

/**
 * Refund credits back to a user — the inverse of `spendCredits`.
 *
 * Intended for rollback scenarios (e.g. a downstream Gemini call fails
 * after credits were already deducted).
 *
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @param {number} amount  Positive integer of credits to refund.
 * @returns {Promise<import("mongoose").Document>} The updated user document.
 */
export async function refundCredits(userId, amount) {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: amount } },
    { new: true },
  );

  if (!updatedUser) {
    throw new Error(`refundCredits failed: user ${userId} not found`);
  }

  return updatedUser;
}
