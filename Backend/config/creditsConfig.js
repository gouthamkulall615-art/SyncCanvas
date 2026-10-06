/**
 * creditsConfig.js
 * Central configuration for AI credit limits, refill rules, action rewards, and costs.
 * All amounts and caps are tuned here.
 */

export const CREDITS_CONFIG = {
  // Timezone for daily resets
  TIMEZONE: "Asia/Kolkata", // IST (UTC+5:30)

  // Daily Refill Allowances (does not stack, resets every midnight IST)
  DAILY_REFILL: {
    STANDARD: 10,
    ADMIN: 30,
  },

  // One-time Welcome Bonus on new account signup
  WELCOME_BONUS: {
    STANDARD: 100,
    ADMIN: 300,
  },

  // Variable Generation Costs
  COSTS: {
    DIAGRAM_GENERATION: 5, // Full AI diagram generation
    DIAGRAM_EDIT: 1,       // Small edit/tweak (ready for future endpoint)
    TEMPLATE: 0,           // Template generation
  },

  // Earn Actions Configuration (Server-enforced rewards and caps)
  ACTIONS: {
    REFERRAL: {
      KEY: "referral",
      REWARD_INVITER: 30,
      REWARD_INVITEE: 30,
      MAX_REWARDS_PER_USER: 10, // Max 10 rewarded referrals per inviter
      DESCRIPTION: "Invite a friend. You both get 30 bonus credits once they generate their first diagram.",
    },
    SHARE: {
      KEY: "share",
      REWARD: 10,
      MAX_PER_WEEK: 3,
      DESCRIPTION: "Share a diagram publicly with a collaborator or link.",
    },
    RATING: {
      KEY: "rating",
      REWARD: 3,
      MAX_PER_DAY: 5,
      DESCRIPTION: "Rate an AI generation result to help us improve.",
    },
    ONBOARDING: {
      KEY: "onboarding",
      REWARD: 20,
      MAX_LIFETIME: 1,
      DESCRIPTION: "Create your first diagram on SyncCanvas.",
    },
    STREAK: {
      KEY: "streak",
      REWARD: 20,
      REQUIRED_DAYS: 7,
      DESCRIPTION: "Log in and create or edit canvas rooms 7 days in a row.",
    },
  },
};

export default CREDITS_CONFIG;
