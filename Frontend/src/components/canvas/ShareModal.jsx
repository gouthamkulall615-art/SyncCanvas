import { useState, useEffect, useRef } from "react";
import {
  FiShare2,
  FiX,
  FiCopy,
  FiCheck,
  FiDownload,
  FiImage,
  FiLink,
  FiExternalLink,
  FiCheckCircle,
} from "react-icons/fi";
import { FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";

export default function ShareModal({
  isOpen,
  onClose,
  roomName = "SyncCanvas Workspace",
  stageRef,
  theme = "dark",
  themeConfig = { background: "#0e1116" },
  shapes = [],
}) {
  const [activeTab, setActiveTab] = useState("link"); // "link" | "export"
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [exportFormat, setExportFormat] = useState("png"); // "png" | "jpeg"
  const [pixelRatio, setPixelRatio] = useState(2); // 1 | 2 | 3
  const [transparentBg, setTransparentBg] = useState(false);
  const [exportScope, setExportScope] = useState("content"); // "content" | "viewport"
  const [downloading, setDownloading] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [showQr, setShowQr] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // Generate a live preview thumbnail when the export tab is selected
  useEffect(() => {
    if (!isOpen || activeTab !== "export" || !stageRef?.current) return;

    try {
      const stage = stageRef.current;
      const previewUrl = generateExportDataUrl({
        format: "png",
        ratio: 0.5,
        transparent: transparentBg,
        scope: exportScope,
      });
      setPreviewDataUrl(previewUrl);
    } catch (e) {
      console.error("Failed to generate preview:", e);
    }
  }, [isOpen, activeTab, transparentBg, exportScope, shapes.length]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: roomName,
          text: `Collaborate with me on ${roomName} in SyncCanvas!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  /**
   * Helper that builds an offscreen canvas with background fill & Konva rendering
   */
  const generateExportDataUrl = ({ format, ratio, transparent, scope }) => {
    const stage = stageRef?.current;
    if (!stage) return null;

    let cropRect = null;

    if (scope === "content") {
      // Find content bounding box across layers
      try {
        const layer = stage.getLayers()[0];
        if (layer && shapes.length > 0) {
          const clientRect = layer.getClientRect({ skipTransform: false });
          if (clientRect && clientRect.width > 20 && clientRect.height > 20) {
            const padding = 40;
            cropRect = {
              x: clientRect.x - padding,
              y: clientRect.y - padding,
              width: clientRect.width + padding * 2,
              height: clientRect.height + padding * 2,
            };
          }
        }
      } catch (e) {
        cropRect = null;
      }
    }

    const exportWidth = cropRect ? cropRect.width : stage.width();
    const exportHeight = cropRect ? cropRect.height : stage.height();

    // Create an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = exportWidth * ratio;
    canvas.height = exportHeight * ratio;
    const ctx = canvas.getContext("2d");

    // 1. Fill background if not transparent
    if (!transparent) {
      ctx.fillStyle = themeConfig.background || (theme === "light" ? "#f5f6f8" : "#0e1116");
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Render Konva stage content onto the canvas
    const konvaCanvas = stage.toCanvas({
      pixelRatio: ratio,
      x: cropRect ? cropRect.x : 0,
      y: cropRect ? cropRect.y : 0,
      width: exportWidth,
      height: exportHeight,
    });

    ctx.drawImage(konvaCanvas, 0, 0);

    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    return canvas.toDataURL(mime, 0.95);
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const dataUrl = generateExportDataUrl({
        format: exportFormat,
        ratio: pixelRatio,
        transparent: transparentBg,
        scope: exportScope,
      });

      if (!dataUrl) throw new Error("Could not capture canvas");

      const link = document.createElement("a");
      const cleanName = roomName
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase()
        .slice(0, 30);
      link.download = `${cleanName || "synccanvas"}-${Date.now()}.${exportFormat}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    setDownloading(true);
    try {
      const stage = stageRef?.current;
      if (!stage) return;

      const dataUrl = generateExportDataUrl({
        format: "png",
        ratio: 2,
        transparent: transparentBg,
        scope: exportScope,
      });

      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2200);
    } catch (err) {
      console.error("Copy image failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    shareUrl,
  )}&bgcolor=1a1d24&color=ffffff&margin=6`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#1a1d24] border border-zinc-800 shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 flex items-center justify-center">
              <FiShare2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Share & Export Canvas
              </h2>
              <p className="text-xs text-zinc-400 truncate max-w-[280px]">
                {roomName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-zinc-800/40">
          <button
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-2 pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "link"
                ? "border-white text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FiLink size={14} />
            <span>Shareable Link</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "export"
                ? "border-white text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FiImage size={14} />
            <span>Download Image</span>
          </button>
        </div>

        {/* Tab 1: Shareable Link */}
        {activeTab === "link" && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Room Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-zinc-900/90 border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none select-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    copied
                      ? "bg-zinc-200 text-black shadow-md"
                      : "bg-white hover:bg-zinc-200 text-black shadow-md cursor-pointer"
                  }`}
                >
                  {copied ? (
                    <>
                      <FiCheck size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy size={14} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Links */}
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Quick Share
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <FiShare2 size={13} />
                  <span>Device Share</span>
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Join my SyncCanvas room "${roomName}": ${shareUrl}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/20 text-emerald-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <FaWhatsapp size={14} />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Collaborating on ${roomName} via @SyncCanvas: ${shareUrl}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-zinc-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <FaXTwitter size={13} />
                  <span>Share on X</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowQr((v) => !v)}
                  className="px-3 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>{showQr ? "Hide QR" : "Show QR Code"}</span>
                </button>
              </div>
            </div>

            {/* Optional QR Code */}
            {showQr && (
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center justify-center animate-in fade-in duration-200">
                <img
                  src={qrApiUrl}
                  alt="Room QR Code"
                  className="w-36 h-36 rounded-lg border border-zinc-700 shadow-md"
                />
                <p className="text-[11px] text-zinc-400 mt-2 text-center">
                  Scan to join room immediately on mobile or tablet
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Download Image */}
        {activeTab === "export" && (
          <div className="p-5 space-y-4">
            {/* Live Canvas Preview Thumbnail */}
            <div className="rounded-xl border border-zinc-800 bg-[#0e1116] p-2 flex flex-col items-center justify-center min-h-[140px] max-h-[180px] overflow-hidden relative group">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Canvas Export Preview"
                  className="max-h-[160px] w-auto object-contain rounded shadow"
                />
              ) : (
                <div className="text-zinc-500 text-xs flex items-center gap-1.5">
                  <FiImage size={15} />
                  <span>Previewing current canvas...</span>
                </div>
              )}
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] bg-black/70 text-zinc-300 backdrop-blur-sm">
                {shapes.length} Elements
              </span>
            </div>

            {/* Export Settings Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Format selection */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setExportFormat("png")}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      exportFormat === "png"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("jpeg")}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      exportFormat === "jpeg"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    JPEG
                  </button>
                </div>
              </div>

              {/* Resolution selection */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Resolution
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  {[
                    { r: 1, label: "1x" },
                    { r: 2, label: "2x HD" },
                    { r: 3, label: "3x 4K" },
                  ].map((res) => (
                    <button
                      key={res.r}
                      type="button"
                      onClick={() => setPixelRatio(res.r)}
                      className={`py-1.5 rounded-lg font-semibold transition-all ${
                        pixelRatio === res.r
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scope & Background toggles */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Content Scope
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setExportScope("content")}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      exportScope === "content"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    All Shapes
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportScope("viewport")}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      exportScope === "viewport"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Screen View
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Background
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setTransparentBg(false)}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      !transparentBg
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Solid
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransparentBg(true)}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      transparentBg
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Transparent
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 font-bold text-xs text-black shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiDownload size={15} />
                <span>{downloading ? "Exporting..." : "Download Image"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImageToClipboard}
                disabled={downloading}
                className="py-3 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-zinc-700/80"
                title="Copy image to clipboard"
              >
                {copiedImage ? (
                  <>
                    <FiCheck size={14} className="text-zinc-100" />
                    <span className="text-zinc-100">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
