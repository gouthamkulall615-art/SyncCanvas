import PageLayout from "../components/layout/PageLayout";
import { FiCheckCircle, FiAlertTriangle, FiCode } from "react-icons/fi";

export default function Terms() {
  return (
    <PageLayout
      badge="Legal & Compliance"
      title="Terms of Service"
      subtitle="Last updated: January 2026. Plain English guidelines for using SyncCanvas."
    >
      <div className="max-w-4xl mx-auto space-y-8 mb-16">
        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#14171f] border border-zinc-800">
            <FiCheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">
              You Own Your Diagrams
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All architectural sketches, vector shapes, and diagrams created on
              SyncCanvas belong 100% to you and your team.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#14171f] border border-zinc-800">
            <FiCode className="w-6 h-6 text-purple-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">
              MIT Open Source
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The underlying software is licensed under the permissive MIT
              license, allowing personal and commercial modifications.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#14171f] border border-zinc-800">
            <FiAlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">
              Acceptable Use
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No distributed denial of service attempts, brute forcing room PINs,
              or transmitting malicious payloads.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-[#14171f]/90 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-white mb-2">
              1. Acceptance of Terms
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              By accessing SyncCanvas or connecting via WebSocket client, you
              agree to be bound by these terms. If you disagree with any part of
              the terms, you may discontinue use or deploy a private instance of
              the software.
            </p>
          </section>

          <section className="pt-6 border-t border-zinc-800/80">
            <h3 className="text-base font-bold text-white mb-2">
              2. Ephemeral Storage and Availability
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              SyncCanvas provides ephemeral collaboration rooms that automatically
              expire after 24 hours. While we design for 99.99% availability, you
              are encouraged to take snapshots or export vital architecture diagrams
              prior to session expiration.
            </p>
          </section>

          <section className="pt-6 border-t border-zinc-800/80">
            <h3 className="text-base font-bold text-white mb-2">
              3. Rate Limiting and Fair Use
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To guarantee smooth sub-millisecond collaboration for all users,
              our gateways enforce rate limits on room generation and PIN
              verification attempts. Automated scripting or fuzzing of room tokens
              is strictly prohibited.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
