import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Star,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  ChevronDown,
} from "lucide-react";
import api from "../api/axios";
import SyncyRobot from "../components/ui/SyncyRobot";

function formatResetCountdown(seconds) {
  if (seconds <= 0) return "in moments";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `in ${h}h ${m}m`;
  if (m > 0) return `in ${m}m ${s}s`;
  return `in ${s}s`;
}

function formatDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Credits() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live countdown timer state
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Referral copy state
  const [copied, setCopied] = useState(false);

  // Ledger state & pagination
  const [ledgerItems, setLedgerItems] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [hasMoreLedger, setHasMoreLedger] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  // Claim interactive states
  const [activeModal, setActiveModal] = useState(null); // 'share' | 'rating'
  const [shareInput, setShareInput] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingNote, setRatingNote] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Quiet upgrade state
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState(null);

  // 1. Fetch balance and status
  const fetchCreditsData = async () => {
    try {
      setError(null);
      const res = await api.get("/credits");
      setData(res.data);
      setSecondsLeft(res.data.secondsUntilReset || 0);

      // Keep user in localStorage synced
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...stored,
            daily: res.data.daily,
            bonus: res.data.bonus,
            credits: res.data.total,
          })
        );
      } catch {
        // ignore
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.error || "Failed to load credits information.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch initial ledger
  const fetchInitialLedger = async () => {
    try {
      setLedgerLoading(true);
      const res = await api.get("/credits/ledger?limit=8");
      setLedgerItems(res.data.items || []);
      setHasMoreLedger(res.data.hasMore);
      setNextCursor(res.data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLedgerLoading(false);
    }
  };

  // 3. Load more ledger items
  const loadMoreLedger = async () => {
    if (!nextCursor || ledgerLoading) return;
    try {
      setLedgerLoading(true);
      const res = await api.get(
        `/credits/ledger?limit=8&cursor=${encodeURIComponent(nextCursor)}`
      );
      setLedgerItems((prev) => [...prev, ...(res.data.items || [])]);
      setHasMoreLedger(res.data.hasMore);
      setNextCursor(res.data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditsData();
    fetchInitialLedger();
  }, []);

  // Tick down seconds until reset
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Re-fetch when day rolls over
          fetchCreditsData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Copy referral link
  const handleCopyLink = () => {
    if (!data?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Claim generic action
  const handleClaimAction = async (actionKey, payload = {}) => {
    setActionSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post(`/credits/claim/${actionKey}`, payload);
      setActionSuccess(res.data.message || "Reward claimed successfully.");
      setTimeout(() => {
        setActiveModal(null);
        setActionSuccess(null);
      }, 1200);
      await fetchCreditsData();
      await fetchInitialLedger();
    } catch (err) {
      setActionError(err.response?.data?.error || "Could not claim reward.");
    } finally {
      setActionSubmitting(false);
    }
  };

  // Quiet refill upgrade
  const handleRefillBonus = async () => {
    setUpgrading(true);
    setUpgradeMsg(null);
    try {
      const res = await api.post("/credits/upgrade", { credits: 100 });
      setUpgradeMsg(res.data.message || "Refilled +100 bonus credits.");
      await fetchCreditsData();
      await fetchInitialLedger();
      setTimeout(() => setUpgradeMsg(null), 3000);
    } catch (err) {
      setUpgradeMsg(err.response?.data?.error || "Refill failed.");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-base text-zinc-300 font-sans p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-[720px] space-y-6 animate-pulse">
          <div className="h-4 w-28 bg-zinc-800 rounded"></div>
          <div className="h-14 w-44 bg-zinc-800 rounded-lg"></div>
          <div className="h-40 bg-app-surface border border-zinc-800 rounded-xl"></div>
          <div className="h-48 bg-app-surface border border-zinc-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-app-base text-zinc-300 font-sans p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-[720px] bg-app-surface border border-zinc-800 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchCreditsData}
            className="px-4 py-2 text-xs bg-app-raised hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    daily = 10,
    bonus = 0,
    total = 10,
    referralCode = "",
    referralStats = { friendsJoined: 0, creditsEarned: 0 },
    earnStatus = {},
  } = data || {};

  return (
    <div className="min-h-screen bg-app-base text-zinc-300 font-sans pb-16">
      {/* Top Simple Navigation - matches Dashboard header */}
      <header className="border-b border-zinc-800/80 bg-app-header/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-1.5 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <button
            onClick={() => {
              fetchCreditsData();
              fetchInitialLedger();
            }}
            title="Refresh balance"
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg border border-zinc-800 bg-app-raised hover:bg-zinc-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Container (Max width 720px, left-aligned) */}
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* ======================================================== */}
        {/* 1. BALANCE SECTION */}
        {/* ======================================================== */}
        <section aria-labelledby="balance-heading" className="space-y-1">
          <h1
            id="balance-heading"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
          >
            Credits Balance
          </h1>
          <div className="pt-1">
            <div className="text-5xl font-bold tracking-tight text-white font-sans">
              {total}
            </div>
            <div className="text-sm font-medium text-zinc-400 mt-1">
              {daily} daily · {bonus} bonus
            </div>
            <div className="text-xs text-zinc-400 mt-1.5 font-mono tabular-nums">
              Daily credits reset {formatResetCountdown(secondsLeft)}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. WAYS TO EARN (ROWS, NOT CARDS) */}
        {/* ======================================================== */}
        <section aria-labelledby="earn-heading" className="space-y-3">
          <div>
            <h2
              id="earn-heading"
              className="text-sm font-semibold text-white tracking-tight"
            >
              Ways to earn
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bonus credits never expire and are consumed after your daily allowance.
            </p>
          </div>

          <div className="border border-zinc-800 rounded-xl divide-y divide-white/5 bg-app-surface overflow-hidden">
            {/* ROW 1: Referral */}
            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-raised transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Invite a friend
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                    +{earnStatus.referral?.reward || 30}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Invite a friend, you both get 30 credits once they generate their first diagram.
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs text-zinc-400 font-mono tabular-nums">
                  {earnStatus.referral?.rewardedCount || 0} of{" "}
                  {earnStatus.referral?.maxRewarded || 10} rewarded
                </span>
              </div>
            </div>

            {/* ROW 2: Share a diagram */}
            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-raised transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Share a public diagram
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                    +{earnStatus.share?.reward || 10}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Share a diagram with collaborators or publicly. Max 3 per week.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-zinc-400 font-mono tabular-nums">
                  {earnStatus.share?.claimedThisWeek || 0} of{" "}
                  {earnStatus.share?.maxPerWeek || 3} this week
                </span>
                {earnStatus.share?.available ? (
                  <button
                    onClick={() => {
                      setActionError(null);
                      setActiveModal("share");
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-[0_2px_10px_rgba(147,51,234,0.25)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Claim
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium">Cap reached</span>
                )}
              </div>
            </div>

            {/* ROW 3: Rate AI result */}
            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-raised transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Rate an AI result
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                    +{earnStatus.rating?.reward || 3}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Provide a quick rating and optional note on generated diagrams. Max 5 per day.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-zinc-400 font-mono tabular-nums">
                  {earnStatus.rating?.claimedToday || 0} of{" "}
                  {earnStatus.rating?.maxPerDay || 5} today
                </span>
                {earnStatus.rating?.available ? (
                  <button
                    onClick={() => {
                      setActionError(null);
                      setActiveModal("rating");
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-app-raised hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Rate
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium">Cap reached</span>
                )}
              </div>
            </div>

            {/* ROW 4: Onboarding (First diagram) */}
            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-raised transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    First diagram created
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                    +{earnStatus.onboarding?.reward || 20}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  One-time onboarding bonus awarded after creating your first canvas room.
                </p>
              </div>
              <div className="shrink-0">
                {earnStatus.onboarding?.claimed ? (
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Done</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaimAction("onboarding")}
                    disabled={actionSubmitting}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-[0_2px_10px_rgba(147,51,234,0.25)] focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>

            {/* ROW 5: 7-day streak */}
            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-raised transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    7-day activity streak
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                    +{earnStatus.streak?.reward || 20}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Log in and work on collaborative canvases 7 days in a row.
                </p>
              </div>
              <div className="shrink-0">
                {earnStatus.streak?.claimed ? (
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Done</span>
                  </span>
                ) : earnStatus.streak?.available ? (
                  <button
                    onClick={() => handleClaimAction("streak")}
                    disabled={actionSubmitting}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-[0_2px_10px_rgba(147,51,234,0.25)] focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Claim
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    <span>Day {earnStatus.streak?.currentDays || 1} of 7</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. REFERRAL SECTION */}
        {/* ======================================================== */}
        <section aria-labelledby="referral-heading" className="space-y-3">
          <div>
            <h2
              id="referral-heading"
              className="text-sm font-semibold text-white tracking-tight"
            >
              Referral link
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Share your personal link. Both you and your friend receive 30 bonus credits once they create their first diagram.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={
                  referralCode
                    ? `${window.location.origin}/register?ref=${referralCode}`
                    : "Generating code..."
                }
                className="w-full bg-app-inset border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-lg bg-app-raised hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-zinc-400 tabular-nums">
              {referralStats.friendsJoined} {referralStats.friendsJoined === 1 ? "friend" : "friends"} joined, {referralStats.creditsEarned} credits earned
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. HISTORY (COMPACT TABLE FROM LEDGER) */}
        {/* ======================================================== */}
        <section aria-labelledby="history-heading" className="space-y-3">
          <div>
            <h2
              id="history-heading"
              className="text-sm font-semibold text-white tracking-tight"
            >
              Credit history
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Record of all refills, generations, refunds, and earned bonuses.
            </p>
          </div>

          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-app-surface">
            {ledgerItems.length === 0 && !ledgerLoading ? (
              <div className="p-8 text-center space-y-3">
                <div className="inline-block opacity-40">
                  <SyncyRobot size={36} floating={false} interactive={false} />
                </div>
                <p className="text-xs text-zinc-400">No activity yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-app-inset text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th scope="col" className="py-2.5 px-3.5">
                        Date
                      </th>
                      <th scope="col" className="py-2.5 px-3.5">
                        Reason
                      </th>
                      <th scope="col" className="py-2.5 px-3.5 text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {ledgerItems.map((item) => (
                      <tr key={item._id} className="hover:bg-app-raised transition-colors">
                        <td className="py-2.5 px-3.5 text-zinc-400 font-mono whitespace-nowrap text-[11px] tabular-nums">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-200">
                          <span>{item.reason}</span>
                          <span className="text-[10px] text-zinc-400 ml-1.5 font-mono tabular-nums">
                            ({item.bucket})
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3.5 text-right font-mono font-medium tabular-nums ${
                            item.amount > 0 ? "text-emerald-400" : "text-zinc-300"
                          }`}
                        >
                          {item.amount > 0 ? `+${item.amount}` : item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hasMoreLedger && (
              <div className="p-3 border-t border-zinc-800 text-center">
                <button
                  type="button"
                  onClick={loadMoreLedger}
                  disabled={ledgerLoading}
                  className="text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2.5 py-1"
                >
                  {ledgerLoading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. UPGRADE (QUIET SECONDARY SECTION AT BOTTOM) */}
        {/* ======================================================== */}
        <section
          aria-labelledby="refill-heading"
          className="border-t border-zinc-800/80 pt-8 pb-4 space-y-3"
        >
          <div>
            <h2 id="refill-heading" className="text-xs font-semibold text-zinc-300">
              Need extra credits?
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Refill 100 bonus credits instantly to test diagrams without waiting for daily resets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefillBonus}
              disabled={upgrading}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-app-raised hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {upgrading ? "Adding credits..." : "Refill 100 Credits"}
            </button>
            {upgradeMsg && (
              <span className="text-xs text-zinc-300 animate-in fade-in">
                {upgradeMsg}
              </span>
            )}
          </div>
        </section>
      </main>

      {/* ======================================================== */}
      {/* INTERACTIVE CLAIM MODALS */}
      {/* ======================================================== */}
      {activeModal === "share" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-app-surface border border-zinc-800 p-5 space-y-4 text-white shadow-2xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Claim Share Reward</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your shared diagram or canvas room ID to verify and claim +10 bonus credits.
              </p>
            </div>
            <input
              type="text"
              placeholder="e.g. room-token or diagram title"
              value={shareInput}
              onChange={(e) => setShareInput(e.target.value)}
              className="w-full bg-app-inset border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            {actionSuccess && <p className="text-xs text-emerald-400">{actionSuccess}</p>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!shareInput.trim() || actionSubmitting}
                onClick={() =>
                  handleClaimAction("share", { diagramId: shareInput.trim() })
                }
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 cursor-pointer shadow-[0_2px_10px_rgba(147,51,234,0.25)] focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {actionSubmitting ? "Verifying..." : "Claim +10"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "rating" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-app-surface border border-zinc-800 p-5 space-y-4 text-white shadow-2xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Rate an AI Generation</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Help improve Syncy's diagram layout quality and earn +3 bonus credits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className={`p-1 text-sm rounded transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    star <= ratingStars ? "text-amber-400" : "text-zinc-600"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs text-zinc-400 ml-2 font-mono tabular-nums">
                {ratingStars}/5
              </span>
            </div>

            <textarea
              placeholder="Optional feedback note..."
              rows={2}
              value={ratingNote}
              onChange={(e) => setRatingNote(e.target.value)}
              className="w-full bg-app-inset border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />

            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            {actionSuccess && <p className="text-xs text-emerald-400">{actionSuccess}</p>}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() =>
                  handleClaimAction("rating", {
                    rating: ratingStars,
                    note: ratingNote.trim(),
                  })
                }
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 cursor-pointer shadow-[0_2px_10px_rgba(147,51,234,0.25)] focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {actionSubmitting ? "Submitting..." : "Claim +3"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
