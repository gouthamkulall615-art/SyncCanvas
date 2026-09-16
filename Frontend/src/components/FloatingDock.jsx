"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

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

  // Reduced the peak magnification from 80 to 56 so it fits elegantly in the h-16/w-16 containers
  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);

  // Reduced the peak icon magnification from 40 to 28 so they don't look excessively huge
  const widthTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 28, 20],
  );
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 28, 20],
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
                : "left-full ml-4 top-1/2 -translate-y-1/2"
              /* Added slightly more margin (ml-4 instead of ml-2) for vertical tooltips to ensure they clear the UI comfortably */
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
