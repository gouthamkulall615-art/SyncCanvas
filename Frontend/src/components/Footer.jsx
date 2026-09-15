import React from "react";
import { useNavigate } from "react-router-dom";
import SpecularButton from "./SpecularButton";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();

  // Handles the redirection for "Open SyncCanvas"
  const handleOpenCanvas = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/register");
  };

  return (
    <footer className="footer-wrapper relative w-full pt-32 pb-8 px-6 border-t border-white/5">
      {/* Background Elements */}
      <div className="footer-dotted-bg"></div>
      <div className="footer-glow"></div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center">
        {/* --- CTA Section --- */}
        <div className="text-center mb-32">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to sync?
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Your ideas shouldn't wait for the next meeting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Open Canvas Button */}
            <button
              onClick={handleOpenCanvas}
              className="px-8 py-3.5 bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transform hover:-translate-y-1 cursor-pointer"
            >
              Open SyncCanvas
            </button>

            {/* View on GitHub Button wrapped with an external link */}
            <a
              href="https://github.com/gouthamkulall615-art/SyncCanvas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <SpecularButton>View on GitHub →</SpecularButton>
            </a>
          </div>
        </div>

        {/* --- Footer Grid --- */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16 border-t border-white/10 pt-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 4H4V16"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M8 8H20V20H8V8Z" fill="white" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                SyncCanvas
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              The open-source, real-time collaborative canvas for modern teams.
            </p>
          </div>

          {/* Links Columns */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Product</h4>
            <a href="#" className="footer-link">
              Features
            </a>
            <a href="#" className="footer-link">
              Integrations
            </a>
            <a href="#" className="footer-link">
              Changelog
            </a>
            <a href="#" className="footer-link">
              Roadmap
            </a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Resources</h4>
            <a
              href="https://github.com/gouthamkulall615-art/SyncCanvas"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Documentation
            </a>
            <a
              href="https://github.com/gouthamkulall615-art/SyncCanvas"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
            <a href="#" className="footer-link">
              Community
            </a>
            <a href="#" className="footer-link">
              Support
            </a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Legal</h4>
            <a href="#" className="footer-link">
              Privacy Policy
            </a>
            <a href="#" className="footer-link">
              Terms of Service
            </a>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-zinc-500 text-xs">
          <p>© 2026 SyncCanvas. All rights reserved.</p>

          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a
              href="https://github.com/gouthamkulall615-art/SyncCanvas"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;