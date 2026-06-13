import { FileScan, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOCRStore } from "../store/ocrStore.js";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetAll = useOCRStore((s) => s.resetAll);

  const handleHome = () => {
    if (location.pathname !== "/") {
      resetAll();
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={handleHome}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FileScan className="w-5 h-5 text-bg-primary" />
          </div>
          <div className="text-left">
            <h1 className="font-display text-lg font-bold text-text-primary tracking-tight">
              OCR Studio
            </h1>
            <p className="text-xs text-text-muted">
              智能图像文字识别 · 排版还原
            </p>
          </div>
        </button>

        <nav className="flex items-center gap-2">
          <button
            onClick={handleHome}
            className={`btn-ghost ${location.pathname === "/" ? "text-accent-primary" : ""}`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">工作台</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
