import { useState, useRef, useEffect } from "react";
import { Search, ArrowRight, Plus, Settings, Moon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userInitial = userData.name
    ? userData.name.charAt(0).toUpperCase()
    : "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="w-full bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-3.5 flex items-center justify-between font-sans text-white relative z-50">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <a href="/dashboard" className="flex items-center gap-2.5 group">
          <span className="relative flex items-center justify-center text-[#9333ea] bg-purple-600/15 border border-purple-500/30 p-2 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.2)] group-hover:border-purple-500 transition-colors">
            <svg viewBox="0 0 28 28" width="18" height="18" fill="currentColor">
              <rect x="3" y="3" width="16" height="16" rx="4" opacity="0.5" />
              <rect x="9" y="9" width="16" height="16" rx="4" />
            </svg>
          </span>
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
            SyncCanvas
          </span>
        </a>
      </div>

      {/* Central Command Search Bar */}
      <div className="hidden md:flex relative w-[380px] max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search active rooms, templates..."
          className="w-full bg-[#121214] border border-zinc-800/80 rounded-xl pl-10 pr-12 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-600"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400">
          <span>⌘</span>K
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Room Active Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full cursor-default">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-emerald-500 text-xs font-semibold tracking-wide">
            Room Active
          </span>
        </div>

        {/* Quick Join Input */}
        <div className="hidden sm:flex relative">
          <input
            type="text"
            placeholder="JOIN VIA CODE..."
            maxLength={6}
            className="w-36 bg-[#121214] border border-zinc-800/85 rounded-lg pl-3 pr-8 py-2 text-xs font-mono uppercase text-zinc-200 focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-600 tracking-wider"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200 transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 rounded-md">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Host Room CTA Button */}
        <button className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(147,51,234,0.25)] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Host Room
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 hover:border-purple-500 overflow-hidden ml-1 flex items-center justify-center text-sm font-bold text-zinc-200 transition-all focus:outline-none shadow-sm"
          >
            {userInitial}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0c0c0e] border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-zinc-800/80 mb-1">
                <p className="font-medium text-zinc-200 truncate">
                  {userData.name || "Developer"}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {userData.email || "user@syncanvas.io"}
                </p>
              </div>

              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-500" />
                Settings
              </button>

              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              >
                <Moon className="w-4 h-4 text-zinc-500" />
                Theme (Dark)
              </button>

              <div className="border-t border-zinc-800/80 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
