import { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { useOCRStore } from "../store/ocrStore.js";
import { api } from "../lib/api.js";

export default function ImagePreview() {
  const { taskId, ocrResult, currentPage, setCurrentPage } = useOCRStore();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPages = ocrResult?.pages.length || 0;
  const imageUrl = taskId ? api.getTaskImage(taskId, currentPage) : "";

  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentPage, taskId]);

  const goToPage = (delta: number) => {
    const next = Math.max(1, Math.min(totalPages, currentPage + delta));
    setCurrentPage(next);
  };

  if (!taskId || !ocrResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted">
        <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
        <p>暂无图片预览</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-bg-secondary/30 rounded-2xl overflow-hidden ${
        isFullscreen ? "fixed inset-6 z-50 rounded-3xl shadow-2xl" : ""
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-bg-primary/50">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-medium text-text-primary">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-text-muted w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            title="旋转"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            title="全屏"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin flex items-center justify-center p-6 relative">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`第 ${currentPage} 页`}
            className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-300 rounded-lg"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-white/5 bg-bg-primary/50">
          <button
            onClick={() => goToPage(-1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  page === currentPage
                    ? "bg-accent-primary text-bg-primary shadow-lg shadow-cyan-500/20"
                    : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
