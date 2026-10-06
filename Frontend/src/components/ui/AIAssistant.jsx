import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSend, FiX, FiZap, FiCheck, FiArrowUpRight } from "react-icons/fi";
import LatticeLoader from "./LatticeLoader";
import SyncyRobot from "./SyncyRobot";
import api from "../../api/axios";

const QUICK_PROMPTS = [
  "Microservices architecture with API gateway",
  "User authentication flow with database & token service",
  "Event-driven pub/sub queue pipeline",
];

const ADMIN_EMAIL_FALLBACK = "gouthamkulall615@gmail.com";

const isUserAdmin = (user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  const email = (user.email || "").toLowerCase().trim();
  return (
    email === ADMIN_EMAIL_FALLBACK ||
    email.startsWith("admin@") ||
    email.includes("+admin@")
  );
};

function formatResetCountdown(seconds) {
  if (!seconds || seconds <= 0) return "soon";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AIAssistant({
  onGenerate = async (prompt) => {
    console.log("AI prompt submitted:", prompt);
  },
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaderStatus, setLoaderStatus] = useState("working");
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Credit state
  const [creditsInfo, setCreditsInfo] = useState(() => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      // ignore
    }
    const admin = isUserAdmin(storedUser);
    const daily = storedUser?.daily != null ? storedUser.daily : (admin ? 30 : 10);
    const bonus = storedUser?.bonus != null ? storedUser.bonus : 0;
    const total = storedUser?.credits != null ? storedUser.credits : (daily + bonus);
    return {
      daily,
      bonus,
      total,
      secondsUntilReset: 0,
      isAdmin: admin,
    };
  });

  const textareaRef = useRef(null);
  const timerTimeoutRef = useRef(null);

  // Ticking countdown effect for daily reset
  useEffect(() => {
    if (!creditsInfo.secondsUntilReset || creditsInfo.secondsUntilReset <= 0) return;
    const interval = setInterval(() => {
      setCreditsInfo((prev) => ({
        ...prev,
        secondsUntilReset: Math.max(0, (prev.secondsUntilReset || 0) - 1),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [creditsInfo.secondsUntilReset]);

  // Fetch verified credits from backend
  const fetchCredits = async () => {
    try {
      const res = await api.get("/credits");
      if (res.data) {
        const daily = res.data.daily ?? 10;
        const bonus = res.data.bonus ?? 0;
        const total = res.data.total ?? (daily + bonus);
        setCreditsInfo({
          daily,
          bonus,
          total,
          secondsUntilReset: res.data.secondsUntilReset || 0,
          isAdmin: res.data.isAdmin,
        });
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...u,
              daily,
              bonus,
              credits: total,
              role: res.data.isAdmin ? "admin" : u.role || "user",
            }),
          );
        } catch {
          // ignore
        }
      }
    } catch {
      // If unauthenticated / guest, check local storage
      const guestDaily = Number(
        localStorage.getItem("syncy_guest_daily") || "10",
      );
      setCreditsInfo((prev) => ({
        ...prev,
        daily: guestDaily,
        bonus: 0,
        total: guestDaily,
      }));
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  useEffect(() => {
    if (open) {
      fetchCredits();
      const t = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, []);

  const dailyMax = creditsInfo.isAdmin ? 30 : 10;
  const totalAvailable = creditsInfo.daily + creditsInfo.bonus;
  const isExhausted = totalAvailable <= 0;
  const dailyPercent = Math.min(
    100,
    Math.max(0, Math.round((creditsInfo.daily / dailyMax) * 100)),
  );

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    if (isExhausted) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setLoaderStatus("working");
    setError(null);

    try {
      const resData = await onGenerate(trimmed);

      if (resData && typeof resData.daily === "number") {
        setCreditsInfo((prev) => ({
          ...prev,
          daily: resData.daily,
          bonus: resData.bonus ?? prev.bonus,
          total: resData.credits ?? (resData.daily + (resData.bonus ?? prev.bonus)),
        }));
      } else if (resData && typeof resData.credits === "number") {
        fetchCredits();
      } else {
        // Fallback local decrement
        setCreditsInfo((prev) => {
          const nextDaily = Math.max(0, prev.daily - 5);
          return {
            ...prev,
            daily: nextDaily,
            total: nextDaily + prev.bonus,
          };
        });
      }

      setLoaderStatus("done");
      timerTimeoutRef.current = setTimeout(() => {
        setPrompt("");
        setOpen(false);
        setLoading(false);
        setLoaderStatus("working");
      }, 1000);
    } catch (err) {
      console.error("AI generation failed:", err);
      const isCreditErr =
        err?.isInsufficientCredits ||
        err?.creditData?.upgradeRequired ||
        err?.message?.toLowerCase().includes("credit");

      if (isCreditErr) {
        setCreditsInfo((prev) => ({
          ...prev,
          daily: 0,
          bonus: 0,
          total: 0,
        }));
      }

      setError(err?.message || "Something went wrong. Try again.");
      setLoaderStatus("error");
      timerTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        setLoaderStatus("working");
      }, 1800);
    }
  };

  const handleUpgradePlan = async () => {
    setUpgrading(true);
    try {
      const res = await api.post("/ai/upgrade", { credits: 100 });
      if (res.data) {
        setCreditsInfo({
          credits: res.data.credits,
          totalCredits: res.data.totalCredits,
          usedCredits: res.data.usedCredits,
          isAdmin: creditsInfo.isAdmin,
        });
      }
      setUpgradeSuccess(true);
      setTimeout(() => {
        setUpgradeSuccess(false);
        setShowUpgradeModal(false);
        setUpgrading(false);
      }, 1200);
    } catch {
      // Offline / guest refill simulation
      localStorage.setItem("syncy_guest_credits_used", "0");
      setCreditsInfo((prev) => ({
        ...prev,
        credits: prev.totalCredits,
        usedCredits: 0,
      }));
      setUpgradeSuccess(true);
      setTimeout(() => {
        setUpgradeSuccess(false);
        setShowUpgradeModal(false);
        setUpgrading(false);
      }, 1200);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="absolute z-50 bottom-[148px] right-4 md:bottom-6 md:right-6 flex flex-col items-end gap-3 select-none">
      {open && (
        <div className="w-[calc(100vw-32px)] sm:w-[370px] max-w-[370px] max-h-[calc(100vh-170px)] overflow-y-auto rounded-2xl bg-[#0e1017] border border-zinc-800 shadow-2xl shadow-black/80 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <SyncyRobot
                size={36}
                floating={false}
                state={loading ? "thinking" : "idle"}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white tracking-tight">
                    Syncy
                  </span>
                  {creditsInfo.isAdmin ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      Free Plan
                    </span>
                  )}
                </div>
                <span
                  aria-live="polite"
                  className={`text-[10px] font-medium ${
                    loading ? "text-purple-400" : "text-zinc-400"
                  }`}
                >
                  {loading ? "Thinking..." : "Ready"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close Syncy"
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Credits Display & Manage Link */}
          {/* Credits Display */}
          <div className="mb-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800" aria-live="polite">
            {/* Line 1: Daily */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-zinc-300">
                  Daily:{" "}
                  <strong className="text-white font-semibold">
                    {creditsInfo.daily} / {dailyMax}
                  </strong>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Daily resets in {formatResetCountdown(creditsInfo.secondsUntilReset)}
                </span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    totalAvailable <= 0
                      ? "bg-zinc-700"
                      : totalAvailable < 10
                      ? "bg-amber-500"
                      : "bg-purple-500"
                  }`}
                  style={{ width: `${dailyPercent}%` }}
                />
              </div>
            </div>

            {/* Line 2: Bonus */}
            <div className="flex items-center justify-between text-xs mt-2.5 pt-2 border-t border-zinc-800/80">
              <span className="text-[11px] font-medium text-zinc-300">
                Bonus:{" "}
                <strong className="text-white font-semibold">
                  {creditsInfo.bonus}
                </strong>
              </span>
              <Link
                to="/credits"
                onClick={() => setOpen(false)}
                className="text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                Earn credits
              </Link>
            </div>

            {/* Subline: Total available */}
            <div className="mt-2 text-[10px] text-zinc-500">
              {totalAvailable} total available
            </div>
          </div>

          {/* Prompt textarea or Exhausted Banner */}
          {isExhausted ? (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2.5 my-2">
              <div>
                <p className="text-xs font-semibold text-white">
                  Out of credits
                </p>
                <p className="text-[11px] text-zinc-400 leading-snug mt-1 font-mono">
                  Daily resets in {formatResetCountdown(creditsInfo.secondsUntilReset)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Earn bonus credits through invites, shares, or feedback to keep generating.
                </p>
              </div>
              <Link
                to="/credits"
                onClick={() => setOpen(false)}
                className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Earn credits</span>
                <FiArrowUpRight size={13} />
              </Link>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={
                  'Ask Syncy to build — e.g. "a microservices payment architecture"'
                }
                rows={3}
                className="w-full resize-none rounded-xl bg-[#0b0d13] border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 text-xs sm:text-sm text-white placeholder-zinc-500 p-3 outline-none transition-colors disabled:opacity-50 select-text"
              />

              {/* Quick Suggestions */}
              <div className="mt-2.5 flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-400 font-medium">
                  Try asking
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(qp)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 leading-snug">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-[10px] text-zinc-500 font-mono leading-tight">
                  Enter to send · Shift+Enter for new line
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || loading}
                  className={`shrink-0 flex items-center justify-center gap-1.5 rounded-xl text-white text-xs font-medium px-3.5 py-2 transition-colors ${
                    loading
                      ? "bg-purple-600/80 cursor-wait"
                      : !prompt.trim()
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500 cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <LatticeLoader
                      status={loaderStatus}
                      label="Thinking"
                      doneLabel="Done in"
                      errorLabel="Failed after"
                      pattern="orbit"
                      grid={3}
                      shape="round"
                      doneColor="#22c55e"
                      errorColor="#ef4444"
                      cellSize={6}
                      gap={2}
                      fontSize={14}
                      step={90}
                      idleOpacity={0.15}
                      glow={false}
                      glowColor=""
                      showTimer
                      color="#f5f5f5"
                    />
                  ) : (
                    <>
                      <FiSend size={13} />
                      <span>Generate · 5 credits</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Syncy Trigger Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Syncy" : "Open Syncy AI Assistant"}
        title="Syncy - AI Canvas Assistant"
        className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all bg-[#0e1017] border border-zinc-800 hover:border-zinc-700 shadow-xl cursor-pointer ${
          open ? "border-purple-500/60" : ""
        }`}
      >
        <SyncyRobot
          size={46}
          floating={!open}
          state={loading ? "thinking" : "idle"}
          showBadge={!open}
          badgeText={isExhausted ? "0 credits" : "Syncy"}
        />
      </button>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1017] border border-zinc-800 p-5 shadow-2xl text-white relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FiZap size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Syncy AI Credits
                </h3>
                <p className="text-xs text-zinc-400">
                  {totalAvailable} credits available
                </p>
              </div>
            </div>

            {/* Info Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-200">
                  Daily Quota & Bonus
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {creditsInfo.daily} daily + {creditsInfo.bonus} bonus
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Daily credits refill every 24 hours. You can earn bonus credits for invites, shares, and ratings on the Credits & Rewards page.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                to="/credits"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Credits & Rewards</span>
                <FiArrowUpRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
