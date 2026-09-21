import PageLayout from "../components/layout/PageLayout";
import { FiShield, FiLock, FiClock, FiDatabase } from "react-icons/fi";

export default function Privacy() {
  return (
    <PageLayout
      badge="Privacy & Security"
      title="Privacy Policy"
      subtitle="Last updated: January 2026. Simple, transparent, and respectful of your data privacy."
    >
      <div className="max-w-4xl mx-auto space-y-8 mb-16">
        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#14171f] border border-zinc-800">
            <FiShield className="w-6 h-6 text-purple-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">No Data Selling</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We will never monetize, sell, or rent your whiteboard diagrams or
              personal credentials to third parties.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#14171f] border border-zinc-800">
            <FiClock className="w-6 h-6 text-blue-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">24-Hour Room TTL</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Workspace records automatically expire and are purged from database
              indexes 24 hours after creation.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#14171f] border border-zinc-800">
            <FiLock className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Salted Hashing</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Passwords are automatically hashed using bcrypt with salt rounds;
              we never store plain text passwords.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-[#14171f]/90 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-white mb-2">
              1. Information We Collect
            </h3>
            <p className="text-xs text-zinc-400 mb-2">
              We collect minimal information required to authenticate and power
              your real-time collaboration sessions:
            </p>
            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
              <li>
                <strong className="text-zinc-200">Account Credentials:</strong>{" "}
                Name, email address, and bcrypt-hashed password, or verified
                profile data from Google OAuth.
              </li>
              <li>
                <strong className="text-zinc-200">Session Metadata:</strong> Room
                title, random 24-byte session token, 6-digit access PIN, and
                participant limit.
              </li>
              <li>
                <strong className="text-zinc-200">Ephemeral CRDT Data:</strong>{" "}
                Vector coordinates and drawing paths held in server memory for
                active room participants.
              </li>
            </ul>
          </section>

          <section className="pt-6 border-t border-zinc-800/80">
            <h3 className="text-base font-bold text-white mb-2">
              2. Cookies and Local Storage
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              SyncCanvas does not use intrusive tracking cookies or cross-site
              ad pixels. We use standard browser <code className="text-purple-300">localStorage</code> to
              store your JWT authorization token and <code className="text-purple-300">sessionStorage</code> to
              remember your verified room host status across reloads.
            </p>
          </section>

          <section className="pt-6 border-t border-zinc-800/80">
            <h3 className="text-base font-bold text-white mb-2">
              3. Self-Hosted Deployments
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              When you clone and deploy SyncCanvas to your own infrastructure via
              Docker, you maintain 100% data sovereignty. No telemetry, diagrams,
              or user records are ever phoned home to any third-party analytics
              server.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
