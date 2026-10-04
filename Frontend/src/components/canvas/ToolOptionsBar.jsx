import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPenTool } from "react-icons/fi";
import { LuEraser } from "react-icons/lu";

const STROKE_WIDTH_PRESETS = [
  { width: 2, label: "Fine", lineClass: "h-[2px]" },
  { width: 4, label: "Medium", lineClass: "h-[4px]" },
  { width: 6, label: "Bold", lineClass: "h-[6px]" },
  { width: 10, label: "Thick", lineClass: "h-[8px]" },
];

const ERASER_SIZE_PRESETS = [
  { size: 14, label: "S", circleSize: "w-3 h-3" },
  { size: 28, label: "M", circleSize: "w-5 h-5" },
  { size: 48, label: "L", circleSize: "w-7 h-7" },
];

export default function ToolOptionsBar({
  activeTool,
  penColor,
  onPenColorChange,
  penWidth,
  onPenWidthChange,
  eraserSize,
  onEraserSizeChange,
  theme = "dark",
}) {
  const colorInputRef = useRef(null);
  const isLight = theme === "light";

  const palette = [
    isLight ? "#111827" : "#ffffff",
    "#64748b",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
  ];

  const isCustomColor = !palette.some(
    (c) => c.toLowerCase() === (penColor || "").toLowerCase(),
  );

  const showPen = activeTool === "pen";
  const showEraser = activeTool === "eraser";

  if (!showPen && !showEraser) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="z-40 pointer-events-auto
          /* Desktop placement: centered right below top floating dock */
          hidden md:flex absolute top-24 left-1/2 -translate-x-1/2 items-center gap-3.5 px-4 py-2.5 rounded-2xl
          bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 shadow-2xl text-white"
      >
        {showPen && (
          <>
            {/* Tool indicator */}
            <div className="flex items-center gap-1.5 pr-1 border-r border-zinc-800">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <FiPenTool size={13} />
              </span>
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Pen
              </span>
            </div>

            {/* Stroke Width Section */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Width
              </span>
              <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60">
                {STROKE_WIDTH_PRESETS.map((preset) => {
                  const isActive = penWidth === preset.width;
                  return (
                    <button
                      key={preset.width}
                      type="button"
                      onClick={() => onPenWidthChange(preset.width)}
                      title={`${preset.label} (${preset.width}px)`}
                      className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-blue-500/25 text-blue-400 border border-blue-500/50 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-3.5 rounded-full bg-current ${preset.lineClass}`}
                      />
                      <span className="text-[11px]">{preset.width}px</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-px h-6 bg-zinc-800" />

            {/* Stroke Color Section */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Color
              </span>
              <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60">
                {palette.map((color) => {
                  const isActive =
                    (penColor || "").toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onPenColorChange(color)}
                      title={color}
                      className={`w-6 h-6 rounded-lg transition-transform flex items-center justify-center ${
                        isActive
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1d24] scale-110 shadow-md"
                          : "hover:scale-105 opacity-90 hover:opacity-100"
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-lg border border-black/20 shadow-inner"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  );
                })}

                {/* Custom Color Picker Button */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    title="Custom color"
                    className={`w-6 h-6 rounded-lg transition-transform flex items-center justify-center p-[2px] ${
                      isCustomColor
                        ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1d24] scale-110 shadow-md"
                        : "hover:scale-105 opacity-90 hover:opacity-100"
                    }`}
                  >
                    <div
                      className="w-full h-full rounded-lg shadow-inner border border-white/20"
                      style={{
                        background: isCustomColor
                          ? penColor
                          : "conic-gradient(from 180deg at 50% 50%, #f43f5e, #fbbf24, #10b981, #3b82f6, #8b5cf6, #f43f5e)",
                      }}
                    />
                  </button>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={penColor || "#ffffff"}
                    onChange={(e) => onPenColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                  />
                </div>
              </div>
            </div>

            <div className="w-px h-6 bg-zinc-800" />

            {/* Live Stroke Preview */}
            <div
              className="flex items-center gap-1.5 pl-1"
              title="Current stroke preview"
            >
              <div
                className="w-7 h-7 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center"
              >
                <div
                  className="rounded-full shadow-sm"
                  style={{
                    backgroundColor: penColor || "#ffffff",
                    width: Math.min(20, Math.max(4, penWidth * 2)),
                    height: Math.min(20, Math.max(4, penWidth * 2)),
                  }}
                />
              </div>
            </div>
          </>
        )}

        {showEraser && (
          <>
            {/* Tool indicator */}
            <div className="flex items-center gap-1.5 pr-1 border-r border-zinc-800">
              <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                <LuEraser size={13} />
              </span>
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Eraser
              </span>
            </div>

            {/* Eraser Size Section */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Size
              </span>
              <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60">
                {ERASER_SIZE_PRESETS.map((preset) => {
                  const isActive = eraserSize === preset.size;
                  return (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => onEraserSizeChange(preset.size)}
                      title={`Eraser size: ${preset.label} (${preset.size}px)`}
                      className={`h-7 px-3 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-red-500/25 text-red-400 border border-red-500/50 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`rounded-full border border-current bg-current/20 ${preset.circleSize}`}
                      />
                      <span className="text-[11px] font-semibold">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-px h-6 bg-zinc-800" />

            <span className="text-[11px] text-zinc-400 italic">
              Click or drag across strokes and shapes to erase
            </span>
          </>
        )}
      </motion.div>

      {/* Mobile Drawer/Bar Placement (fixed right above mobile dock) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.16 }}
        className="md:hidden fixed bottom-20 inset-x-3 z-40 p-3 rounded-2xl
          bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 shadow-2xl text-white"
      >
        {showPen && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FiPenTool size={13} className="text-blue-400" />
                <span className="text-xs font-semibold text-zinc-300">
                  Pen Settings
                </span>
              </div>
              {/* Preview dot */}
              <div
                className="w-4 h-4 rounded-full border border-zinc-700"
                style={{ backgroundColor: penColor || "#ffffff" }}
              />
            </div>

            {/* Separate Stroke Width */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Stroke Width
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {STROKE_WIDTH_PRESETS.map((preset) => {
                  const isActive = penWidth === preset.width;
                  return (
                    <button
                      key={preset.width}
                      type="button"
                      onClick={() => onPenWidthChange(preset.width)}
                      className={`h-8 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-blue-500/25 text-blue-400 border border-blue-500/50"
                          : "bg-zinc-800/60 text-zinc-400 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-3 rounded-full bg-current ${preset.lineClass}`}
                      />
                      <span>{preset.width}px</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separate Color */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Color
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {palette.map((color) => {
                  const isActive =
                    (penColor || "").toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onPenColorChange(color)}
                      className={`flex-none w-7 h-7 rounded-lg transition-transform ${
                        isActive
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1d24] scale-110"
                          : "opacity-80"
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-lg border border-black/20"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  );
                })}
                <label className="flex-none w-7 h-7 rounded-lg relative cursor-pointer">
                  <div
                    className="w-full h-full rounded-lg border border-white/20 shadow-inner"
                    style={{
                      background: isCustomColor
                        ? penColor
                        : "conic-gradient(from 180deg at 50% 50%, #f43f5e, #fbbf24, #10b981, #3b82f6, #8b5cf6, #f43f5e)",
                    }}
                  />
                  <input
                    type="color"
                    value={penColor || "#ffffff"}
                    onChange={(e) => onPenColorChange(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {showEraser && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <LuEraser size={13} className="text-red-400" />
              <span className="text-xs font-semibold text-zinc-300">
                Eraser Size
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ERASER_SIZE_PRESETS.map((preset) => {
                const isActive = eraserSize === preset.size;
                return (
                  <button
                    key={preset.size}
                    type="button"
                    onClick={() => onEraserSizeChange(preset.size)}
                    className={`h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-red-500/25 text-red-400 border border-red-500/50"
                        : "bg-zinc-800/60 text-zinc-400 border border-transparent"
                    }`}
                  >
                    <div
                      className={`rounded-full border border-current bg-current/20 ${preset.circleSize}`}
                    />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-400 text-center italic">
              Tap or drag over strokes & shapes to erase
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
