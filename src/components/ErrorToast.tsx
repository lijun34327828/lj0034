import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useOCRStore } from "../store/ocrStore.js";

export default function ErrorToast() {
  const { error, setError } = useOCRStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed top-20 right-6 z-[200] max-w-sm animate-fade-in-up">
      <div className="card !p-4 !bg-accent-danger/15 border-accent-danger/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-danger/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-accent-danger" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary text-sm">操作失败</p>
            <p className="text-text-secondary text-sm mt-0.5 break-words">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-md hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
