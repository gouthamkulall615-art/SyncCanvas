import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SpecularButton from "../ReactBits/SpecularButton";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Integrations", href: "/integrations" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Docs", href: "/docs" },
  {
    label: "GitHub",
    href: "https://github.com/gouthamkulall615-art/SyncCanvas",
  },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleCtaClick = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/register");
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled || menuOpen
          ? "bg-[#0e1116]/80 backdrop-blur-md border-zinc-800"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        {/* Brand Logo */}
        <a
          href="#top"
          className="flex items-center gap-3 text-white font-bold text-xl tracking-tight z-50"
          onClick={() => setMenuOpen(false)}
        >
          <span className="relative flex items-center justify-center text-[#9333ea]">
            <svg viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
              <rect x="3" y="3" width="16" height="16" rx="4" opacity="0.5" />
              <rect x="9" y="9" width="16" height="16" rx="4" />
            </svg>
          </span>
          SyncCanvas
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
                <span className="text-xs text-zinc-600">↗</span>
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        {/* Desktop CTA Button */}
        <div className="hidden md:block">
          <SpecularButton
            size="sm"
            radius={999}
            baseColor="#1a1d24"
            lineColor="#9333ea"
            textColor="#f5f5f5"
            shineSize={12}
            shineFade={45}
            proximity={220}
            onClick={handleCtaClick}
          >
            Try it live
          </SpecularButton>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="md:hidden relative z-50 p-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
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

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-[#0e1116]/95 backdrop-blur-xl border-b border-zinc-800 overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-6 py-6 space-y-4">
          {NAV_LINKS.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-medium text-zinc-300 hover:text-white transition-colors flex items-center justify-between"
                onClick={() => setMenuOpen(false)}
                target="_blank"
                rel="noreferrer"
              >
                <span>{link.label}</span>
                <span className="text-xs text-zinc-600">↗</span>
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-base font-medium text-zinc-300 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}

          <div className="pt-4 border-t border-zinc-800/80 flex flex-col w-full">
            {/* Wrapping the SpecularButton to force it full-width */}
            <div className="w-full flex *:w-full">
              <SpecularButton
                size="md"
                radius={12}
                baseColor="#1a1d24"
                lineColor="#9333ea"
                textColor="#f5f5f5"
                className="w-full flex justify-center py-4"
                onClick={() => {
                  setMenuOpen(false);
                  handleCtaClick();
                }}
              >
                Try it live
              </SpecularButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
