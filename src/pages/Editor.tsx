import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  RotateCcw,
  Copy,
  Check,
  Layers,
  Eye,
  Edit3,
} from "lucide-react";
import ImagePreview from "../components/ImagePreview.js";
import RichEditor from "../components/RichEditor.js";
import ExportModal from "../components/ExportModal.js";
import { useOCRStore } from "../store/ocrStore.js";

export default function Editor() {
  const navigate = useNavigate();
  const { ocrResult, resetAll, setEditedContent, currentTask, editedContent } =
    useOCRStore();
  const [showExport, setShowExport] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ocrResult) {
      navigate("/");
    }
  }, [ocrResult, navigate]);

  const handleCopyContent = async () => {
    const plain = editedContent.replace(/<[^>]*>/g, "\n").replace(/\n+/g, "\n").trim();
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (ocrResult) {
      const html = ocrResult.pages
        .map(
          (page, idx) =>
            `<h2>第 ${idx + 1} 页</h2>\n` +
            page.blocks
              .map((b, i, arr) => {
                if (i > 0 && b.paragraphIndex !== arr[i - 1].paragraphIndex) {
                  return `<p></p>\n<p>${b.text}</p>`;
                }
                return `<p>${b.text}</p>`;
              })
              .join("\n"),
        )
        .join('\n<hr class="page-break" />\n');
      setEditedContent(html);
    }
  };

  if (!ocrResult) return null;

  const stats = {
    totalPages: ocrResult.pages.length,
    totalBlocks: ocrResult.pages.reduce((s, p) => s + p.blocks.length, 0),
    avgConfidence:
      ocrResult.pages.reduce(
        (s, p) =>
          s + p.blocks.reduce((ss, b) => ss + b.confidence, 0) /
            Math.max(1, p.blocks.length),
        0,
      ) / Math.max(1, ocrResult.pages.length),
  };

  return (
    <div className="h-screen pt-16 flex flex-col bg-bg-primary overflow-hidden">
      <div className="flex-shrink-0 border-b border-white/5 glass-strong">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetAll();
                navigate("/");
              }}
              className="btn-ghost text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-accent-primary flex-shrink-0" />
              <span className="font-medium text-text-primary truncate max-w-xs">
                {currentTask?.originalFileName || "识别结果"}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {stats.totalPages} 页
            </span>
            <span>{stats.totalBlocks} 个文本块</span>
            <span>
              识别置信度{" "}
              <span className="text-accent-success font-medium">
                {Math.round(stats.avgConfidence * 100)}%
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`btn-ghost text-sm ${
                showPreview ? "text-accent-primary bg-accent-primary/10" : ""
              }`}
              title="切换预览面板"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">预览</span>
            </button>
            <button
              onClick={handleCopyContent}
              className="btn-ghost text-sm"
              title="复制纯文本"
            >
              {copied ? (
                <Check className="w-4 h-4 text-accent-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {copied ? "已复制" : "复制"}
              </span>
            </button>
            <button
              onClick={handleReset}
              className="btn-ghost text-sm"
              title="恢复原始识别结果"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">重置</span>
            </button>
            <button onClick={() => setShowExport(true)} className="btn-primary text-sm">
              <Download className="w-4 h-4" />
              导出文档
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div
          className={`h-full gap-4 transition-all duration-300 ${
            showPreview ? "grid grid-cols-1 lg:grid-cols-[400px_1fr]" : "flex"
          }`}
        >
          {showPreview && (
            <div className="h-full min-h-0">
              <ImagePreview />
            </div>
          )}
          <div className="h-full min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Edit3 className="w-4 h-4 text-accent-primary" />
              <span className="text-sm font-medium text-text-primary">
                编辑识别内容
              </span>
              <span className="text-xs text-text-muted ml-auto">
                可自由编辑文字、调整排版和样式
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <RichEditor />
            </div>
          </div>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
