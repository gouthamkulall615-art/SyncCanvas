import React, { useEffect, useState, useRef } from "react";

const DEFAULT_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

export function EncryptedText({
  text = "",
  encryptedClassName = "text-neutral-500",
  revealedClassName = "dark:text-white text-black",
  revealDelayMs = 50,
  initialDelayMs = 0,
  scrambleIntervalMs = 40,
  chars = DEFAULT_CHARS,
  className = "",
  as: Component = "span",
  hoverTrigger = true,
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const intervalRef = useRef(null);
  const revealTimerRef = useRef(null);

  const startAnimation = () => {
    clearInterval(intervalRef.current);
    clearTimeout(revealTimerRef.current);
    setRevealedCount(0);

    const run = () => {
      // Periodic scramble for unrevealed letters
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
        setRevealedCount(currentRevealed);
        if (currentRevealed < text.length) {
          revealTimerRef.current = setTimeout(step, revealDelayMs);
        } else {
          clearInterval(intervalRef.current);
        }
      };

      revealTimerRef.current = setTimeout(step, revealDelayMs);
    };

    if (initialDelayMs > 0) {
      revealTimerRef.current = setTimeout(run, initialDelayMs);
    } else {
      run();
    }
  };

  useEffect(() => {
    startAnimation();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(revealTimerRef.current);
    };
  }, [text, revealDelayMs, initialDelayMs]);

  return (
    <Component
      className={`inline-block select-none cursor-default ${className}`}
      onMouseEnter={hoverTrigger ? startAnimation : undefined}
    >
      {text.split("").map((char, index) => {
        if (char === "\n") {
          return <br key={index} />;
        }
        if (char === " ") {
          return <span key={index}> </span>;
        }

        const isRevealed = index < revealedCount;
        const displayChar = isRevealed ? char : (scrambled[index] || chars[0]);

        return (
          <span
            key={index}
            className={isRevealed ? revealedClassName : encryptedClassName}
          >
            {displayChar}
          </span>
        );
      })}
    </Component>
  );
}

export default EncryptedText;
