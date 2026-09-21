import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Palette,
  Shield,
  X,
  Check,
  Sun,
  Moon,
  LogOut,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CURSOR_COLORS = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#ef4444" },
  { name: "Pink", hex: "#ec4899" },
];

export default function SettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cursorColor, setCursorColor] = useState("#8b5cf6");
  const [defaultTheme, setDefaultTheme] = useState("dark");
  const [showNametags, setShowNametags] = useState(true);
  const [autoCopyLink, setAutoCopyLink] = useState(true);

  // Load saved preferences on open
  useEffect(() => {
    if (isOpen) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setName(storedUser.name || "");
        setEmail(storedUser.email || "");
      } catch (err) {
        console.error("Error reading stored user:", err);
      }

      setCursorColor(localStorage.getItem("userColor") || "#8b5cf6");
      setDefaultTheme(localStorage.getItem("canvasTheme") || "dark");
      setShowNametags(localStorage.getItem("showNametags") !== "false");
      setAutoCopyLink(localStorage.getItem("autoCopyLink") === "true");
      setSavedSuccess(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.name = name.trim() || storedUser.name || "Developer";
      localStorage.setItem("user", JSON.stringify(storedUser));
    } catch (err) {
      console.error("Failed to update user name:", err);
    }

    localStorage.setItem("userColor", cursorColor);
    localStorage.setItem("canvasTheme", defaultTheme);
    localStorage.setItem("showNametags", String(showNametags));
    localStorage.setItem("autoCopyLink", String(autoCopyLink));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onClose();
    navigate("/login");
  };

  const handleClearCache = () => {
    localStorage.removeItem("canvasTheme");
    localStorage.removeItem("userColor");
    localStorage.removeItem("autoCopyLink");
    localStorage.removeItem("showNametags");
    setCursorColor("#8b5cf6");
    setDefaultTheme("dark");
    setShowNametags(true);
    setAutoCopyLink(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1200);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg my-auto bg-[#14171f] border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col font-sans text-white max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800/80 bg-[#10131a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Settings & Preferences
              </h3>
              <p className="text-[11px] text-zinc-400">
                Customize your profile and whiteboard defaults
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Segmented Tabs (Fully responsive across mobile & desktop) */}
        <div className="px-5 sm:px-6 pt-4 shrink-0">
          <div className="grid grid-cols-3 gap-1 bg-[#090b0e] p-1 rounded-xl border border-zinc-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                activeTab === "canvas"
                  ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Canvas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                activeTab === "account"
                  ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Account</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b0e] border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-purple-500 transition-colors"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Shown above your cursor and in active room attendee badges.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Account Email
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b0e]/60 border border-zinc-800/60 text-zinc-400 text-sm cursor-not-allowed outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Preferred Cursor & Avatar Color
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {CURSOR_COLORS.map((col) => {
                    const isSelected = cursorColor === col.hex;
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setCursorColor(col.hex)}
                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#14171f] scale-110"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Cursor Preview */}
                <div className="mt-3.5 p-3 rounded-xl bg-[#090b0e] border border-zinc-800/80 flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Live Preview:
                  </span>
                  <div
                    className="px-2.5 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1.5 shadow-sm truncate max-w-[200px]"
                    style={{ backgroundColor: cursorColor }}
                  >
                    <span>↖</span>
                    <span className="truncate">{name || "You"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CANVAS DEFAULTS */}
          {activeTab === "canvas" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Default Room Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDefaultTheme("dark")}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      defaultTheme === "dark"
                        ? "bg-[#090c10] border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        : "bg-[#090c10]/50 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Moon className="w-5 h-5 text-purple-400 shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold truncate">Dark Theme</div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        #0e1116 (Default)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultTheme("light")}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      defaultTheme === "light"
                        ? "bg-[#090c10] border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        : "bg-[#090c10]/50 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold truncate">Light Theme</div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        #f5f6f8 Whiteboard
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Multiplayer Cursor Nametags
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Show teammate names floating on their cursors
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showNametags}
                    onChange={(e) => setShowNametags(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Auto-Copy Room Link
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Copy link to clipboard upon room generation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCopyLink}
                    onChange={(e) => setAutoCopyLink(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT & SECURITY */}
          {activeTab === "account" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                  Session & Storage
                </h4>
                <div className="p-3.5 rounded-xl bg-[#090b0e] border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Authentication</span>
                    <span className="text-emerald-400 font-medium">
                      JWT Authenticated
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Room TTL Policy</span>
                    <span className="text-purple-400 font-mono">
                      24-Hour Auto-Purge
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80">
                <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                  Reset & Cache
                </h4>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reset Local Canvas Preferences</span>
                </button>
              </div>

              <div className="pt-3 border-t border-zinc-800/80">
                <h4 className="text-xs font-semibold text-red-400 mb-2">
                  Account Action
                </h4>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-zinc-800/80 bg-[#10131a] flex items-center justify-between shrink-0">
          <div className="text-xs text-emerald-400 font-medium">
            {savedSuccess && "✓ Saved successfully!"}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] hover:shadow-[0_0_18px_rgba(168,85,247,0.5)] cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
