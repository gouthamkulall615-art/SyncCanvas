import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../landing/Footer";
import BrandLogo from "../common/BrandLogo";

export default function PageLayout({
  badge = "SyncCanvas",
  title,
  subtitle,
  children,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleLaunch = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/register");
  };

  const navLinks = [
    { label: "Features", path: "/features" },
    { label: "Integrations", path: "/integrations" },
    { label: "Roadmap", path: "/roadmap" },
    { label: "Docs", path: "/docs" },
    { label: "Changelog", path: "/changelog" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0e1116] text-white flex flex-col font-sans relative selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background ambient lighting */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-600/10 blur-[140px] pointer-events-none z-0" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#0e1116]/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <BrandLogo size={28} textSize="text-xl" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/gouthamkulall615-art/SyncCanvas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              GitHub
              <span className="text-xs text-zinc-600">↗</span>
            </a>
          </nav>

          {/* Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleLaunch}
              className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
            >
              Open Canvas
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-zinc-400 hover:text-white p-2"
            aria-label="Toggle Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-b border-zinc-800 bg-[#0e1116]/98 px-6 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-zinc-300 py-1.5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/gouthamkulall615-art/SyncCanvas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-300 py-1.5 hover:text-white"
            >
              GitHub ↗
            </a>
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLaunch();
              }}
              className="mt-2 w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium"
            >
              Open Canvas
            </button>
          </div>
        )}
      </header>

      {/* Hero Header for Subpages */}
      <section className="relative z-10 pt-16 pb-12 px-6 text-center max-w-4xl mx-auto">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/25 bg-purple-950/20 backdrop-blur-md text-xs font-medium text-purple-300 mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 pb-20">
        {children}
      </main>

      {/* Standard App Footer */}
      <Footer />
    </div>
  );
}
