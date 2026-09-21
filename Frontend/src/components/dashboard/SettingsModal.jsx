import { useState, useEffect } from "react";
import {
  User,
  Palette,
  Shield,
  X,
  Check,
  Sun,
  Moon,
  Copy,
  Users,
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

  // Load saved preferences from localStorage on open
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
    }, 900);
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
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#14171f] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#10131a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Settings & Preferences
              </h3>
              <p className="text-[11px] text-zinc-400">
                Manage your profile, canvas defaults, and workspace setup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex flex-col sm:flex-row min-h-[380px]">
          {/* Tabs Sidebar */}
          <div className="sm:w-48 bg-[#0d1017] border-b sm:border-b-0 sm:border-r border-zinc-800/80 p-3 flex sm:flex-col gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full text-left ${
                activeTab === "profile"
                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full text-left ${
                activeTab === "canvas"
                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Canvas Defaults</span>
            </button>

            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full text-left ${
                activeTab === "account"
                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Account</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[460px]">
            {/* --- TAB 1: PROFILE --- */}
            {activeTab === "profile" && (
              <div className="space-y-6">
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
                    This name will be displayed above your live cursor in
                    whiteboard rooms.
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
                  <div className="flex items-center gap-3">
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
                  <div className="mt-4 p-3 rounded-xl bg-[#090b0e] border border-zinc-800/80 flex items-center gap-3">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Preview:
                    </span>
                    <div
                      className="px-2.5 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
                      style={{ backgroundColor: cursorColor }}
                    >
                      <span>↖</span>
                      <span>{name || "You"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: CANVAS DEFAULTS --- */}
            {activeTab === "canvas" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Default Canvas Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDefaultTheme("dark")}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                        defaultTheme === "dark"
                          ? "bg-[#090c10] border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          : "bg-[#090c10]/50 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Moon className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Dark Canvas</div>
                        <div className="text-[10px] text-zinc-500">
                          #0e1116 (Default)
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDefaultTheme("light")}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                        defaultTheme === "light"
                          ? "bg-[#090c10] border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          : "bg-[#090c10]/50 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-400" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Light Canvas</div>
                        <div className="text-[10px] text-zinc-500">
                          #f5f6f8 Whiteboard
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Multiplayer Cursor Nametags
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        Show teammate name labels floating next to their cursors
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showNametags}
                      onChange={(e) => setShowNametags(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Auto-Copy Generated Room Link
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        Automatically copy link to clipboard upon room creation
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoCopyLink}
                      onChange={(e) => setAutoCopyLink(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 3: ACCOUNT & SECURITY --- */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                    Session & Storage
                  </h4>
                  <div className="p-4 rounded-xl bg-[#090b0e] border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Authentication</span>
                      <span className="text-emerald-400 font-medium">
                        JWT Authenticated
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Room Token Expiry</span>
                      <span className="text-purple-400 font-mono">
                        24-Hour TTL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80">
                  <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                    Reset & Cache
                  </h4>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-zinc-400" />
                    <span>Reset Local Canvas Preferences</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-zinc-800/80">
                  <h4 className="text-xs font-semibold text-red-400 mb-2">
                    Danger Zone
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
        </div>

        {/* Modal Footer with Save Button */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-[#10131a] flex items-center justify-between">
          <div className="text-xs text-emerald-400 font-medium">
            {savedSuccess && "✓ Preferences saved successfully!"}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
