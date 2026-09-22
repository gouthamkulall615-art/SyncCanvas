import React, { useEffect, useState, useRef, useCallback } from "react";

const DEFAULT_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#*+-%$@!_";

export function EncryptedText({
  text = "",
  encryptedClassName = "text-purple-400/80",
  revealedClassName = "text-white",
  revealDelayMs = 70,
  initialDelayMs = 0,
  scrambleIntervalMs = 65,
  chars = DEFAULT_CHARS,
  className = "",
  as: Component = "span",
  hoverTrigger = false,
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const intervalRef = useRef(null);
  const revealTimerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const lastTriggerTimeRef = useRef(0);

  const startAnimation = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(revealTimerRef.current);

    isAnimatingRef.current = true;
    setRevealedCount(0);

    const run = () => {
      // Scramble loop: updates unrevealed characters with steady cipher glyphs
      intervalRef.current = setInterval(() => {
        let str = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " " || text[i] === "\n") {
            str += text[i];
          } else {
            str += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        setScrambled(str);
      }, scrambleIntervalMs);

      // Progressive reveal from left to right
      let currentRevealed = 0;
      const step = () => {
        currentRevealed += 1;
        // If the next character is a newline, skip it immediately without artificial delay
        while (currentRevealed < text.length && text[currentRevealed] === "\n") {
          currentRevealed += 1;
        }

        setRevealedCount(currentRevealed);

        if (currentRevealed < text.length) {
          revealTimerRef.current = setTimeout(step, revealDelayMs);
        } else {
          clearInterval(intervalRef.current);
          isAnimatingRef.current = false;
        }
      };

      revealTimerRef.current = setTimeout(step, revealDelayMs);
    };

    if (initialDelayMs > 0) {
      revealTimerRef.current = setTimeout(run, initialDelayMs);
    } else {
      run();
    }
  }, [text, chars, revealDelayMs, initialDelayMs, scrambleIntervalMs]);

  useEffect(() => {
    startAnimation();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(revealTimerRef.current);
      isAnimatingRef.current = false;
    };
  }, [startAnimation]);

  const handleMouseEnter = () => {
    if (!hoverTrigger) return;
    // Prevent restarting if already animating
    if (isAnimatingRef.current) return;
    // Stable cooldown (1.2s) so hovering doesn't jitter or spam restarts
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 1200) return;
    lastTriggerTimeRef.current = now;
    startAnimation();
  };

  return (
    <Component
      className={`inline-block select-none cursor-default ${className}`}
      onMouseEnter={hoverTrigger ? handleMouseEnter : undefined}
    >
      {text.split("").map((char, index) => {
        if (char === "\n") {
          return <br key={index} />;
        }
        if (char === " ") {
          return (
            <span
              key={index}
              className="inline-block"
              style={{ width: "0.28em" }}
            >
              &nbsp;
            </span>
          );
        }

        const isRevealed = index < revealedCount;
        const displayChar = isRevealed ? char : (scrambled[index] || chars[0]);

        return (
          <span
            key={index}
            className={`inline-block tabular-nums transition-colors duration-200 ${
              isRevealed ? revealedClassName : encryptedClassName
            }`}
            style={{
              minWidth: isRevealed ? undefined : "0.75ch",
              textAlign: "center",
            }}
          >
            {displayChar}
          </span>
        );
      })}
    </Component>
  );
}

export default EncryptedText;
