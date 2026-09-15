import { FiMoreVertical, FiTrash2 } from "react-icons/fi";

export default function PropertiesPanel({
  selectedId,
  shapes,
  updateShapeProperty,
  deleteSelected,
}) {
  if (!selectedId) return null;

  const currentShape = shapes.find((s) => s.id === selectedId);
  if (!currentShape) return null;

  return (
    <div className="absolute right-6 top-24 z-50 bg-[#232329]/95 backdrop-blur-md border border-zinc-800/80 rounded-xl p-4 w-64 shadow-2xl text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Inspect
        </h3>
        <FiMoreVertical className="text-zinc-500" />
      </div>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] text-zinc-300 mb-2.5">Stroke</p>
          <div className="flex gap-2 items-center">
            {["#e9e9e7", "#ff8a8a", "#6bcf70", "#5ca4f8", "#e67e22"].map((color) => {
              const isActive =
                currentShape.stroke === color ||
                ((currentShape.type === "line" || currentShape.type === "arrow") &&
                  currentShape.fill === color);

              return (
                <button
                  key={color}
                  onClick={() => {
                    if (currentShape.type === "line" || currentShape.type === "arrow")
                      updateShapeProperty("fill", color);
                    updateShapeProperty("stroke", color);
                  }}
                  className={`w-7 h-7 rounded-md transition-all flex items-center justify-center ${
                    isActive ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#232329]" : "hover:bg-white/10"
                  }`}
                >
                  <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color }} />
                </button>
              );
            })}
            <div className="w-px h-5 bg-zinc-700 mx-1"></div>
            <button
              onClick={() => updateShapeProperty("stroke", "transparent")}
              className={`w-7 h-7 rounded-md border border-zinc-700 flex items-center justify-center relative overflow-hidden ${
                currentShape.stroke === "transparent" ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#232329]" : ""
              }`}
            >
              <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#fff_2px,#fff_4px)]"></div>
            </button>
          </div>
        </div>

        {currentShape.type !== "line" && currentShape.type !== "arrow" && currentShape.type !== "text" && (
          <div>
            <p className="text-[11px] text-zinc-300 mb-2.5">Background</p>
            <div className="flex gap-2 items-center">
              {["#262627", "#63292b", "#1d4924", "#20456b", "#523a10"].map((color) => {
                const isActive = currentShape.fill === color;
                return (
                  <button
                    key={color}
                    onClick={() => updateShapeProperty("fill", color)}
                    className={`w-7 h-7 rounded-md transition-all flex items-center justify-center ${
                      isActive ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#232329]" : "hover:bg-white/10"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color }} />
                  </button>
                );
              })}
              <div className="w-px h-5 bg-zinc-700 mx-1"></div>
              <button
                onClick={() => updateShapeProperty("fill", "transparent")}
                className={`w-7 h-7 rounded-md border border-zinc-700 flex items-center justify-center relative overflow-hidden ${
                  currentShape.fill === "transparent" ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#232329]" : ""
                }`}
              >
                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#fff_2px,#fff_4px)]"></div>
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-[11px] text-zinc-300 mb-2.5">Stroke width</p>
          <div className="flex gap-2">
            {[
              { width: 2, label: "Thin", ui: "h-[2px]" },
              { width: 4, label: "Bold", ui: "h-[4px]" },
              { width: 6, label: "Extra Bold", ui: "h-[6px]" },
            ].map((style) => {
              const isActive = (currentShape.strokeWidth || 2) === style.width;
              return (
                <button
                  key={style.width}
                  onClick={() => updateShapeProperty("strokeWidth", style.width)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? "bg-indigo-500/30 text-indigo-200" : "bg-zinc-800/50 hover:bg-zinc-700/50 text-white"
                  }`}
                >
                  <div className={`w-4 bg-current rounded-full ${style.ui}`}></div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] text-zinc-300 mb-2.5">Stroke style</p>
          <div className="flex gap-2">
            {[
              { dash: [], label: "Solid", ui: "border-solid" },
              { dash: [10, 8], label: "Dashed", ui: "border-dashed" },
              { dash: [2, 6], label: "Dotted", ui: "border-dotted" },
            ].map((style, idx) => {
              const currentDash = currentShape.dash || [];
              const isActive = JSON.stringify(currentDash) === JSON.stringify(style.dash);
              return (
                <button
                  key={idx}
                  onClick={() => updateShapeProperty("dash", style.dash)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? "bg-indigo-500/30 text-indigo-200" : "bg-zinc-800/50 hover:bg-zinc-700/50 text-white"
                  }`}
                >
                  <div className={`w-5 border-t-2 border-current ${style.ui}`}></div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800/80 mt-2">
          <button
            onClick={deleteSelected}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Delete
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}