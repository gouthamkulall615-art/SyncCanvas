import React from "react";
import SpecularButton from "./SpecularButton";
import "./Footer.css"; // For the dotted background and specific glows

const Footer = () => {
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
            <button className="px-8 py-3.5 bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transform hover:-translate-y-1">
              Open SyncCanvas
            </button>

            {/* Your animated React Bits button */}
            <SpecularButton>View on GitHub →</SpecularButton>
          </div>
        </div>

        {/* --- Footer Grid --- */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16 border-t border-white/10 pt-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6">
              {/* Logo Icon */}
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
            <a href="#" className="footer-link">
              Documentation
            </a>
            <a href="#" className="footer-link">
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

          {/* Social Icons */}
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            {/* X (Twitter) */}
            <a href="#" className="hover:text-white transition-colors">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* GitHub */}
            <a href="#" className="hover:text-white transition-colors">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
            {/* Discord */}
            <a href="#" className="hover:text-white transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
