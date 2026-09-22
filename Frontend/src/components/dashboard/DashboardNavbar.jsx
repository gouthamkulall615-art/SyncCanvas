import { useState, useRef, useEffect } from "react";
import { Search, Settings, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import SettingsModal from "./SettingsModal";
import BrandLogo from "../common/BrandLogo";

export default function DashboardNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
        <Link
          to="/dashboard"
          className="flex items-center hover:opacity-95 transition-opacity"
        >
          <BrandLogo size={26} textSize="text-lg" />
        </Link>
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
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-emerald-500 text-xs font-semibold tracking-wide">
            Room Active
          </span>
        </div>


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
                onClick={() => {
                  setDropdownOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-zinc-500" />
                Settings
              </button>

              <div className="border-t border-zinc-800/80 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </nav>
  );
}
