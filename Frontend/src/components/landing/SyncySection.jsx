import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LazySyncyRobot from '../ui/LazySyncyRobot';

const PROMPT_TEXT = 'a microservices payment architecture';

const ARCH_NODES = [
  {
    id: 'client',
    label: 'Client App',
    sub: 'Web & Mobile',
    type: 'client',
    fill: '#1e293b',
    stroke: '#94a3b8',
    icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    x: 24,
    y: 135,
    w: 108,
    h: 52,
  },
  {
    id: 'gateway',
    label: 'API Gateway',
    sub: 'Reverse Proxy',
    type: 'server',
    fill: '#132d24',
    stroke: '#34d399',
    icon: 'M4 2h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 12h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm3-7h2v2H7V5zm0 12h2v2H7v-2z',
    x: 162,
    y: 135,
    w: 112,
    h: 52,
  },
  {
    id: 'auth',
    label: 'Auth Service',
    sub: 'OAuth / JWT',
    type: 'auth',
    fill: '#351726',
    stroke: '#f472b6',
    icon: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4',
    x: 304,
    y: 60,
    w: 116,
    h: 52,
  },
  {
    id: 'payment',
    label: 'Payment Service',
    sub: 'Transactions',
    type: 'server',
    fill: '#132d24',
    stroke: '#34d399',
    icon: 'M4 2h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 12h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm3-7h2v2H7V5zm0 12h2v2H7v-2z',
    x: 304,
    y: 210,
    w: 122,
    h: 52,
  },
  {
    id: 'queue',
    label: 'Event Queue',
    sub: 'Kafka Broker',
    type: 'queue',
    fill: '#302213',
    stroke: '#fbbf24',
    icon: 'M12 2 L2 7 L12 12 L22 7 Z M2 17 L12 22 L22 17 M2 12 L12 17 L22 12',
    x: 456,
    y: 210,
    w: 110,
    h: 52,
  },
  {
    id: 'database',
    label: 'Ledger DB',
    sub: 'PostgreSQL',
    type: 'database',
    fill: '#172844',
    stroke: '#60a5fa',
    icon: 'M12 2C6.48 2 2 3.79 2 6s4.48 4 10 4 10-1.79 10-4-4.48-4-10-4zm0 6c-5.52 0-10-1.79-10-4v4c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0 2.21-4.48 4-10 4zm0 6c-5.52 0-10-1.79-10-4v4c0 2.21 4.48 4 10 4s10-1.79 10-4v-4c0 2.21-4.48 4-10 4z',
    x: 456,
    y: 60,
    w: 110,
    h: 52,
  },
];

const CONNECTIONS = [
  { from: 'client', to: 'gateway', d: 'M132 161 L162 161', atNode: 1 },
  { from: 'gateway', to: 'auth', d: 'M274 150 L304 86', atNode: 2 },
  { from: 'gateway', to: 'payment', d: 'M274 172 L304 236', atNode: 3 },
  { from: 'auth', to: 'database', d: 'M420 86 L456 86', atNode: 5 },
  { from: 'payment', to: 'queue', d: 'M426 236 L456 236', atNode: 4 },
  { from: 'payment', to: 'database', d: 'M426 220 L456 100', atNode: 5 },
];

export default function SyncySection() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  const timeoutsRef = useRef([]);

  const [robotMood, setRobotMood] = useState('idle');
  const [typedPrompt, setTypedPrompt] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const handleLaunch = () => {
    const token = localStorage.getItem('token');
    navigate(token ? '/dashboard' : '/register');
  };

  const startAnimation = (isReduced) => {
    clearAllTimeouts();

    if (isReduced) {
      setTypedPrompt(PROMPT_TEXT);
      setVisibleCount(ARCH_NODES.length);
      setRobotMood('idle');
      setIsTyping(false);
      return;
    }

    setTypedPrompt('');
    setVisibleCount(0);
    setIsTyping(true);
    setRobotMood('thinking');

    // Type out prompt character by character
    const charDelay = 35;
    for (let i = 1; i <= PROMPT_TEXT.length; i++) {
      const t = setTimeout(() => {
        setTypedPrompt(PROMPT_TEXT.slice(0, i));
      }, i * charDelay);
      timeoutsRef.current.push(t);
    }

    const typingDuration = PROMPT_TEXT.length * charDelay;

    // After typing, finish prompt cursor and start node sequence
    const tPromptDone = setTimeout(() => {
      setIsTyping(false);
    }, typingDuration + 100);
    timeoutsRef.current.push(tPromptDone);

    // Fade in nodes one by one
    ARCH_NODES.forEach((_, idx) => {
      const tNode = setTimeout(() => {
        setVisibleCount(idx + 1);
      }, typingDuration + 300 + idx * 220);
      timeoutsRef.current.push(tNode);
    });

    // When all nodes appear, robot switches back to idle
    const totalDuration = typingDuration + 300 + ARCH_NODES.length * 220 + 300;
    const tFinish = setTimeout(() => {
      setRobotMood('idle');
    }, totalDuration);
    timeoutsRef.current.push(tFinish);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = mediaQuery.matches;
    setPrefersReducedMotion(reduced);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          startAnimation(reduced);
        }
      },
      { threshold: 0.25 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      clearAllTimeouts();
      observer.disconnect();
    };
  }, []);

  const handleReplay = () => {
    startAnimation(prefersReducedMotion);
  };

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full max-w-5xl px-6 mx-auto mt-20 mb-20 font-sans"
      aria-label="Meet Syncy section"
    >
      {/* Section Header */}
      <div className="mb-12 text-left">
        <span className="text-xs font-bold uppercase tracking-widest text-[#c084fc] mb-3 inline-block">
          AI ASSISTANT
        </span>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
          Describe it. Syncy draws it.
        </h2>
        <p className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed font-normal">
          Type a system in plain English and Syncy builds the architecture on your canvas, live for
          everyone in the room.
        </p>
      </div>

      {/* Two-column layout (stacked on mobile, robot first) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Robot & 3 Facts */}
        <div className="lg:col-span-5 flex flex-col items-start gap-6">
          <div className="w-full flex justify-center lg:justify-start">
            <LazySyncyRobot
              size={220}
              mood={robotMood}
              waveDelay={3}
              waveDuration={3}
              dprMax={1.5}
            />
          </div>

          {/* Three plain facts as rows */}
          <div className="flex flex-col gap-4 text-left w-full">
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
              <strong className="text-white font-semibold">Plain English in.</strong> Describe the
              system, get nodes and connections.
            </p>
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
              <strong className="text-white font-semibold">Shared instantly.</strong> Everyone in the
              room sees the diagram appear.
            </p>
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
              <strong className="text-white font-semibold">Free every day.</strong> Daily credits refill
              automatically, and you can earn more.
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleLaunch}
            type="button"
            className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-all shadow-[0_4px_20px_rgba(147,51,234,0.2)] cursor-pointer inline-flex items-center"
          >
            Try Syncy
          </button>
        </div>

        {/* Right Column: Demo frame styled like MiniCanvasDemo */}
        <div className="lg:col-span-7 w-full">
          <div
            className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-[#0b0d13] flex flex-col shadow-lg"
            aria-label="Syncy architecture demo canvas"
          >
            {/* Background Dots */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
              aria-hidden="true"
            />

            {/* Prompt Line Bar */}
            <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80 bg-[#161b22]/70 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-purple-400 text-sm select-none" aria-hidden="true">
                  ✦
                </span>
                <div className="text-xs sm:text-sm font-mono text-zinc-200 truncate">
                  <span>{typedPrompt || (prefersReducedMotion ? PROMPT_TEXT : '')}</span>
                  {isTyping && (
                    <span className="inline-block w-1.5 h-3.5 bg-purple-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>

              {/* Replay Button */}
              <button
                type="button"
                onClick={handleReplay}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-2 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400 rounded px-1.5 py-0.5 select-none"
              >
                Replay
              </button>
            </div>

            {/* SVG Canvas Area for Generated Architecture */}
            <div className="relative z-10 w-full aspect-[600/340] flex items-center justify-center p-2 sm:p-4">
              <svg
                viewBox="0 0 590 320"
                className="w-full h-full"
                aria-hidden="true"
              >
                {/* Connecting lines */}
                {CONNECTIONS.map((conn, idx) => {
                  const isVisible = visibleCount >= conn.atNode;
                  return (
                    <path
                      key={idx}
                      d={conn.d}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className={`transition-opacity duration-300 ${
                        isVisible ? 'opacity-90' : 'opacity-0'
                      }`}
                    />
                  );
                })}

                {/* Architecture Nodes */}
                {ARCH_NODES.map((node, index) => {
                  const isVisible = index < visibleCount;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className={`transition-all duration-300 ${
                        isVisible
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-2 pointer-events-none'
                      }`}
                    >
                      {/* Node container */}
                      <rect
                        width={node.w}
                        height={node.h}
                        rx="8"
                        fill={node.fill}
                        stroke={node.stroke}
                        strokeWidth="1.5"
                      />

                      {/* Icon */}
                      <g transform="translate(10, 14)">
                        <path
                          d={node.icon}
                          fill={node.stroke}
                          transform="scale(0.85)"
                        />
                      </g>

                      {/* Primary Label */}
                      <text
                        x="38"
                        y="23"
                        fill="#f1f5f9"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="ui-sans-serif, system-ui, sans-serif"
                      >
                        {node.label}
                      </text>

                      {/* Subtitle / Tech Spec */}
                      <text
                        x="38"
                        y="38"
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="ui-sans-serif, system-ui, sans-serif"
                      >
                        {node.sub}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Status Bar */}
            <div className="relative z-10 flex items-center justify-between px-4 py-2 text-[11px] text-zinc-400 border-t border-zinc-800/80 bg-[#161b22]/40">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Synced with room • {visibleCount} nodes generated
              </span>
              <span>100% Zoom</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
