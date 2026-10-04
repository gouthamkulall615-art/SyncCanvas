import { useState, useRef, useEffect } from "react";
import { HiSparkles } from "react-icons/hi2";
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
    const total = admin ? 300 : 100;
    const current =
      storedUser?.credits != null ? storedUser.credits : total;
    const used = Math.max(0, total - current);
    return {
      credits: current,
      totalCredits: total,
      usedCredits: used,
      isAdmin: admin,
    };
  });

  const textareaRef = useRef(null);
  const timerTimeoutRef = useRef(null);

  // Fetch verified credits from backend
  const fetchCredits = async () => {
    try {
      const res = await api.get("/ai/credits");
      if (res.data) {
        setCreditsInfo({
          credits: res.data.credits,
          totalCredits: res.data.totalCredits,
          usedCredits: res.data.usedCredits,
          isAdmin: res.data.isAdmin,
        });
        // Update stored user
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...u,
              credits: res.data.credits,
              totalCredits: res.data.totalCredits,
              usedCredits: res.data.usedCredits,
              role: res.data.isAdmin ? "admin" : u.role || "user",
            }),
          );
        } catch {
          // ignore
        }
      }
    } catch {
      // If unauthenticated / guest, check local storage
      const guestUsed = Number(
        localStorage.getItem("syncy_guest_credits_used") || "0",
      );
      setCreditsInfo((prev) => ({
        ...prev,
        usedCredits: guestUsed,
        credits: Math.max(0, prev.totalCredits - guestUsed),
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

  const isExhausted =
    creditsInfo.usedCredits >= creditsInfo.totalCredits ||
    creditsInfo.credits <= 0;

  const percentUsed = Math.min(
    100,
    Math.round((creditsInfo.usedCredits / creditsInfo.totalCredits) * 100),
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

      if (resData && typeof resData.credits === "number") {
        setCreditsInfo((prev) => ({
          ...prev,
          credits: resData.credits,
          totalCredits: resData.totalCredits || prev.totalCredits,
          usedCredits:
            resData.usedCredits != null
              ? resData.usedCredits
              : Math.max(
                  0,
                  (resData.totalCredits || prev.totalCredits) - resData.credits,
                ),
        }));
      } else {
        // Fallback local increment
        setCreditsInfo((prev) => {
          const nextUsed = Math.min(prev.totalCredits, prev.usedCredits + 10);
          localStorage.setItem(
            "syncy_guest_credits_used",
            String(nextUsed),
          );
          return {
            ...prev,
            usedCredits: nextUsed,
            credits: Math.max(0, prev.totalCredits - nextUsed),
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
          credits: 0,
          usedCredits: prev.totalCredits,
        }));
        setShowUpgradeModal(true);
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
        <div className="w-[310px] sm:w-[370px] max-h-[calc(100vh-170px)] overflow-y-auto rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-purple-500/30 shadow-2xl shadow-purple-900/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <SyncyRobot
                size={38}
                floating={false}
                state={loading ? "thinking" : "idle"}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight">
                    Syncy
                  </span>
                  {creditsInfo.isAdmin ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      Free Plan
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
                    loading ? "text-purple-400" : "text-emerald-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      loading
                        ? "bg-purple-400 animate-ping"
                        : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  {loading ? "Thinking..." : "Ready"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Credits Display & Upgrade Trigger */}
          <div className="mb-3 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 shadow-inner">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isExhausted
                      ? "bg-red-500"
                      : percentUsed > 75
                      ? "bg-amber-400"
                      : "bg-purple-400"
                  }`}
                />
                Credits:{" "}
                <strong className="text-white font-semibold">
                  {creditsInfo.usedCredits} / {creditsInfo.totalCredits} used
                </strong>
              </span>

              {/* Upgrade button in header */}
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  isExhausted
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold shadow-md shadow-orange-950/50 animate-pulse"
                    : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                }`}
              >
                <FiZap size={11} />
                <span>Upgrade</span>
              </button>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isExhausted
                    ? "bg-red-500"
                    : percentUsed > 75
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400"
                }`}
                style={{ width: `${Math.min(100, Math.max(4, percentUsed))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5">
              <span>
                {Math.max(
                  0,
                  creditsInfo.totalCredits - creditsInfo.usedCredits,
                )}{" "}
                credits remaining
              </span>
              <span className="font-mono text-zinc-500">{percentUsed}%</span>
            </div>
          </div>

          {/* Prompt textarea or Exhausted Banner */}
          {isExhausted ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 text-center space-y-2.5 my-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <FiZap size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">
                  You have used all {creditsInfo.totalCredits} credits!
                </p>
                <p className="text-[11px] text-zinc-400 leading-snug mt-1">
                  You’ve reached the {creditsInfo.totalCredits}/{creditsInfo.totalCredits} credit limit. Upgrade your account to continue generating diagrams with Syncy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs shadow-lg shadow-orange-950/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HiSparkles size={14} />
                <span>Upgrade to Continue</span>
              </button>
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
                className="w-full resize-none rounded-xl bg-[#0b0d13] border border-zinc-800/90 focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40 text-xs sm:text-sm text-white placeholder-zinc-500 p-3 outline-none transition-colors disabled:opacity-50 select-text"
              />

              {/* Quick Suggestions */}
              <div className="mt-2.5 flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                  <HiSparkles size={12} className="text-purple-400" />
                  Quick Prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(qp)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/20 text-purple-300 hover:text-white transition-all text-left cursor-pointer"
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
                <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[130px] sm:max-w-none">
                  Enter to generate · Shift+Enter newline
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || loading}
                  className={`shrink-0 flex items-center justify-center gap-1.5 rounded-xl text-white text-xs font-medium px-3.5 py-2 transition-all shadow-lg ${
                    loading
                      ? "bg-purple-600/90 cursor-wait shadow-purple-900/30"
                      : !prompt.trim()
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-purple-900/20"
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
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Syncy Trigger Button with Eye Tracking & Float */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Syncy - AI Canvas Assistant"
        className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
          open
            ? "bg-purple-600/30 backdrop-blur-xl border-2 border-purple-500/80 ring-4 ring-purple-500/25"
            : "bg-[#12141c]/95 backdrop-blur-xl border-2 border-purple-500/50 hover:border-purple-400 hover:shadow-[0_0_24px_rgba(168,85,247,0.45)] hover:scale-105"
        }`}
      >
        <SyncyRobot
          size={52}
          floating={!open}
          state={loading ? "thinking" : "idle"}
          showBadge={!open}
          badgeText={isExhausted ? "Upgrade" : "Syncy"}
        />
        <span
          className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#12141c] shadow-[0_0_8px_rgba(16,185,129,0.8)] ${
            isExhausted ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
          }`}
        />
      </button>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1d24] border border-purple-500/40 p-5 shadow-2xl text-white relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <FiX size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <HiSparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Upgrade Syncy AI Credits
                </h3>
                <p className="text-xs text-zinc-400">
                  Current usage: {creditsInfo.usedCredits} / {creditsInfo.totalCredits} credits used
                </p>
              </div>
            </div>

            {/* Plan Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/30 via-zinc-900/60 to-zinc-900 border border-purple-500/40 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  SyncCanvas Pro
                </span>
                <span className="text-sm font-extrabold text-white">
                  100 Credits Refill
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <FiCheck className="text-emerald-400 shrink-0" size={14} />
                  <span>Instant +100 credits for Syncy AI</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-emerald-400 shrink-0" size={14} />
                  <span>Full architecture diagram & microservices generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-emerald-400 shrink-0" size={14} />
                  <span>High-speed generation with Gemini 2.0 Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-emerald-400 shrink-0" size={14} />
                  <span>Unlimited collaborative rooms</span>
                </li>
              </ul>
            </div>

            {upgradeSuccess ? (
              <div className="py-3 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 mb-2">
                <FiCheck size={16} />
                <span>Credits Refilled Successfully!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleUpgradePlan}
                  disabled={upgrading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-orange-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {upgrading ? (
                    <span>Upgrading...</span>
                  ) : (
                    <>
                      <FiZap size={14} />
                      <span>Upgrade Plan Now</span>
                      <FiArrowUpRight size={14} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-2 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
