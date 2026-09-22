import React from "react";
import { useNavigate } from "react-router-dom";
import FolderFloat from "../ReactBits/FolderFloat";
import "./CollaborativeSection.css";

const FOLDER_ITEMS = [
  "Live Cursors",
  "Real-time Sync",
  "CRDT Powered",
  "Multi-user Editing",
  "Instant Updates",
  "Undo Everywhere",
  "No Exports Needed",
  "Low Latency",
];

// Reusable Cursor Component
const Cursor = ({ color, name, className }) => (
  <div className={`demo-cursor ${className}`}>
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={color}
      stroke="white"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5.5 3L18.5 9.5L10.5 11.5L8.5 19.5L5.5 3Z" />
    </svg>
    <div className="cursor-label" style={{ backgroundColor: color }}>
      {name}
    </div>
  </div>
);

const CollaborativeSection = () => {
  const navigate = useNavigate();

  const handleLaunch = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/register");
  };

  return (
    <section className="collab-wrapper">
      <div className="collab-hero-row">
        <div className="collab-text-col">
          <span className="badge">BUILT FOR COLLABORATION</span>
          <h2 className="collab-title">Everything moves together.</h2>
          <p className="collab-desc">
            A shared canvas where every action is reflected in real time.
            No waiting, no conflicts—just instant synchronous creativity.
          </p>
          <div className="collab-cta-wrap">
            <button
              onClick={handleLaunch}
              className="collab-cta-btn"
              type="button"
            >
              <span>Start collaborating</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <div className="collab-folder-col">
          <FolderFloat
            items={FOLDER_ITEMS}
            label="What's Inside"
            sublabel="8 capabilities"
            trigger="hover"
            closeOnSelect={false}
            physics={true}
            drift={0.55}
            folderColor="#161b22"
            frontColor="#1f242d"
            paperColor="#8B5CF6"
            itemColor="#161b22"
            itemTextColor="#f8fafc"
            labelColor="#ffffff"
            width={200}
            height={148}
            radius={14}
            spread={175}
            lift={28}
            tilt={7}
            flapAngle={34}
            restAngle={14}
            openDuration={520}
            stagger={42}
            bounce={0.28}
          />
        </div>
      </div>

      <div className="cards-grid">
        {/* Card 1: Live Cursors */}
        <div className="feature-card">
          <div className="canvas-window dotted-grid">
            <Cursor name="Maya" color="#a855f7" className="anim-maya" />
            <Cursor name="Theo" color="#3b82f6" className="anim-theo" />
            <Cursor name="Alex" color="#22c55e" className="anim-alex" />
          </div>
          <div className="card-text">
            <h3>Live cursors</h3>
            <p>See where everyone is working, in real time.</p>
          </div>
        </div>

        {/* Card 2: Instant Sync */}
        <div className="feature-card">
          <div className="canvas-window dotted-grid sync-canvas">
            <div className="client-box">
              <div className="client-header">
                <span>Client A</span> <div className="status-dot green"></div>
              </div>
              <div className="doc-block">doc</div>
              <div className="client-footer">Local</div>
            </div>

            <div className="sync-track">
              <div className="lag-pill">0ms lag</div>
            </div>

            <div className="client-box">
              <div className="client-header">
                <span>Client B</span> <div className="status-dot green"></div>
              </div>
              <div className="doc-block">doc</div>
              <div className="client-footer">Remote</div>
            </div>
          </div>
          <div className="card-text">
            <h3>Instant sync</h3>
            <p>Changes appear across every connected screen instantly.</p>
          </div>
        </div>

        {/* Card 3: One Shared Workspace */}
        <div className="feature-card">
          <div className="canvas-window dotted-grid workspace-canvas">
            <div className="node api-node">API routes</div>

            <svg
              className="connection-line"
              width="100"
              height="60"
              viewBox="0 0 100 60"
            >
              <path
                d="M 10 10 C 60 10, 40 50, 90 50"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            <Cursor name="Alex" color="#a855f7" className="anim-drawing" />

            <div className="node db-node">
              <div className="status-dot green"></div> MongoDB Cluster
            </div>
          </div>
          <div className="card-text">
            <h3>One shared workspace</h3>
            <p>Draw, connect ideas, and build together on the same canvas.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollaborativeSection;
