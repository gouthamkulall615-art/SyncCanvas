import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import {
  FiHelpCircle,
  FiChevronDown,
  FiMail,
  FiSend,
  FiCheckCircle,
  FiActivity,
} from "react-icons/fi";

const FAQS = [
  {
    q: "How does room expiration work?",
    a: "Every workspace session is protected by a MongoDB Time-To-Live (TTL) index that automatically purges room records 24 hours after creation. This ensures ephemeral sessions don't clutter your workspace or leave persistent data online indefinitely.",
  },
  {
    q: "How many participants can join a room at once?",
    a: "When creating a room, hosts can configure between 2 and 6 simultaneous seats. The YSocketIO sync server actively tracks live awareness heartbeats and will politely notify newcomers if a room has reached capacity.",
  },
  {
    q: "What happens if I disconnect or lose my WiFi?",
    a: "Because SyncCanvas uses Yjs CRDTs locally in your browser memory, you won't lose your work. When your connection recovers, your client synchronizes state vectors with the server and automatically converges with your team's changes.",
  },
  {
    q: "Can I self-host SyncCanvas for internal team privacy?",
    a: "Yes! SyncCanvas is 100% open-source under the MIT license. You can clone the repo and run it via Docker Compose on your internal VPC, Kubernetes cluster, or on-premises servers without external dependencies.",
  },
  {
    q: "How do I export my canvas diagram?",
    a: "You can take high-resolution PNG snapshots using your browser or the canvas snapshot control. We are also building direct vector SVG and multi-page PDF exports on the public roadmap.",
  },
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Question",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageLayout
      badge="Help & Assistance"
      title="How Can We Help You?"
      subtitle="Find answers to common technical questions, check live server health, or send a message directly to our engineering team."
    >
      {/* System Status Banner */}
      <div className="bg-[#14171f]/80 border border-zinc-800/80 rounded-2xl p-4 md:p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FiActivity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              All Systems Operational
            </h4>
            <p className="text-xs text-zinc-400">
              WebSocket CRDT Gateways • MongoDB Atlas • Google OAuth API
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">
            99.99% Uptime
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* FAQs Accordion Column */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FiHelpCircle className="text-purple-400" /> Frequently Asked
            Questions
          </h3>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#14171f]/90 border border-zinc-800/80 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 text-sm font-semibold text-white hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <FiChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-purple-400" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-5 bg-[#14171f]/90 border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <FiMail className="text-purple-400" /> Send Us a Message
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Encountered a bug or want to suggest an architectural component?
              Let us know.
            </p>

            {submitted ? (
              <div className="p-6 rounded-xl bg-purple-950/30 border border-purple-500/30 text-center space-y-3">
                <FiCheckCircle className="w-8 h-8 text-purple-400 mx-auto" />
                <h4 className="text-base font-bold text-white">
                  Message Dispatched!
                </h4>
                <p className="text-xs text-zinc-300">
                  Thank you, {formData.name || "friend"}. We've received your
                  message and will get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-purple-400 hover:underline pt-2 inline-block cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ada Lovelace"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b0e] border border-zinc-800 text-white placeholder-zinc-600 text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="ada@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b0e] border border-zinc-800 text-white placeholder-zinc-600 text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b0e] border border-zinc-800 text-white text-xs outline-none focus:border-purple-500"
                  >
                    <option>General Question</option>
                    <option>Bug Report / Canvas Glitch</option>
                    <option>Feature / Node Request</option>
                    <option>Self-Hosting Help</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Explain what happened or what you'd like to see..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b0e] border border-zinc-800 text-white placeholder-zinc-600 text-xs outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  <FiSend className="w-3.5 h-3.5" /> Submit Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
