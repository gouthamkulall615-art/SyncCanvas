"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * This is the same mechanics as Aceternity's FloatingDock:
 * - one motion value tracks the cursor position along the dock's axis
 * - every icon measures its own center and asks "how far am I from the cursor"
 * - that distance maps to a width/height range, smoothed by a spring
 * Nothing here changes that math — only the item shape (onClick + isActive
 * instead of href) and axis (x for a row, y for a column) differ.
 */

export function FloatingDock({ items, className }) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={className}
    >
      {items.map((item) => (
        <IconContainer key={item.title} mouseX={mouseX} axis="x" {...item} />
      ))}
    </motion.div>
  );
}

export function FloatingDockVertical({ items, className }) {
  const mouseY = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseY.set(e.pageY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className={className}
    >
      {items.map((item) => (
        <IconContainer key={item.title} mouseY={mouseY} axis="y" {...item} />
      ))}
    </motion.div>
  );
}

function IconContainer({
  mouseX,
  mouseY,
  axis,
  title,
  icon,
  onClick,
  isActive,
}) {
  const ref = useRef(null);

  const mv = axis === "x" ? mouseX : mouseY;

  const distance = useTransform(mv, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    const center =
      axis === "x" ? bounds.x + bounds.width / 2 : bounds.y + bounds.height / 2;
    return val - center;
  });

  // Same range/spring constants as the original Aceternity component.
  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const widthTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );

  const springConfig = { mass: 0.1, stiffness: 150, damping: 12 };
  const width = useSpring(widthTransform, springConfig);
  const height = useSpring(heightTransform, springConfig);
  const widthIcon = useSpring(widthTransformIcon, springConfig);
  const heightIcon = useSpring(heightTransformIcon, springConfig);

  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex aspect-square items-center justify-center rounded-full border transition-colors ${
        isActive
          ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
          : "bg-zinc-800/70 text-zinc-400 hover:text-white border-transparent"
      }`}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{
              opacity: 0,
              y: axis === "x" ? 10 : 0,
              x: axis === "y" ? 10 : "-50%",
            }}
            animate={{ opacity: 1, y: 0, x: axis === "x" ? "-50%" : 0 }}
            exit={{
              opacity: 0,
              y: axis === "x" ? 2 : 0,
              x: axis === "y" ? 2 : "-50%",
            }}
            className={`absolute w-fit whitespace-pre rounded-md border border-zinc-800 bg-[#1a1d24] px-2 py-0.5 text-xs text-zinc-200 pointer-events-none ${
              axis === "x"
                ? "-top-8 left-1/2"
                : "left-full ml-2 top-1/2 -translate-y-1/2"
            }`}
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center"
      >
        {icon}
      </motion.div>
    </motion.button>
  );
}
