import { useState } from "react";
import { X, Download, FileText, File, FileCode, FileImage, CheckCircle, Image, Type } from "lucide-react";
import type { ExportFormat, ExportRequest } from "../../shared/types.js";
import { useOCRStore } from "../store/ocrStore.js";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportOptions {
  fontSize: number;
  fontFamily: string;
  includeImage: boolean;
}

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "Noto Sans SC", label: "思源黑体" },
  { value: "SimHei", label: "黑体" },
  { value: "SimSun", label: "宋体" },
  { value: "FangSong", label: "仿宋" },
  { value: "KaiTi", label: "楷体" },
  { value: "Microsoft YaHei", label: "微软雅黑" },
];

const FONT_SIZE_OPTIONS: number[] = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const FORMATS: {
  format: ExportFormat;
  label: string;
  icon: typeof FileText;
  description: string;
  color: string;
}[] = [
  {
    format: "docx",
    label: "Word 文档",
    icon: FileText,
    description: ".docx - 可在 Word/WPS 中编辑",
    color: "from-blue-500 to-blue-600",
  },
  {
    format: "pdf",
    label: "PDF 文档",
    icon: FileImage,
    description: ".pdf - 通用阅读格式",
    color: "from-red-500 to-red-600",
  },
  {
    format: "md",
    label: "Markdown",
    icon: FileCode,
    description: ".md - 纯文本标记格式",
    color: "from-purple-500 to-purple-600",
  },
  {
    format: "txt",
    label: "纯文本",
    icon: File,
    description: ".txt - 最通用的格式",
    color: "from-slate-500 to-slate-600",
  },
];

export default function ExportModal({ isOpen, onClose }: Props) {
  const [selected, setSelected] = useState<ExportFormat>("docx");
  const [exporting, setExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    fontSize: 14,
    fontFamily: "Noto Sans SC",
    includeImage: false,
  });
  const { exportDocument, isProcessing } = useOCRStore();

  const handleExport = async () => {
    setExporting(true);
    setDownloadUrl(null);
    const url = await exportDocument(selected, options);
    setExporting(false);
    if (url) {
      setDownloadUrl(url);
    }
  };

  const isDocxOrPdf = selected === "docx" || selected === "pdf";

  const handleDownload = () => {
    if (downloadUrl) {
      window.location.href = downloadUrl;
    }
  };

  const handleClose = () => {
    if (!isProcessing && !exporting) {
      setDownloadUrl(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-bg-primary/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg card animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Download className="w-5 h-5 text-accent-primary" />
              导出文档
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              选择您需要的导出格式
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing || exporting}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadUrl ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-accent-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-accent-success" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              导出成功！
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              文档已生成，点击下方按钮下载
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleClose} className="btn-secondary">
                完成
              </button>
              <button onClick={handleDownload} className="btn-primary">
                <Download className="w-4 h-4" />
                下载文件
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {FORMATS.map((f) => {
                const Icon = f.icon;
                const isSelected = selected === f.format;
                return (
                  <button
                    key={f.format}
                    onClick={() => setSelected(f.format)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-accent-primary bg-accent-primary/10 shadow-lg shadow-cyan-500/10"
                        : "border-white/10 bg-bg-secondary/30 hover:border-white/20 hover:bg-bg-secondary/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mb-3`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-medium text-text-primary mb-1">
                      {f.label}
                    </h4>
                    <p className="text-xs text-text-muted">{f.description}</p>
                  </button>
                );
              })}
            </div>

            {isDocxOrPdf && (
              <div className="mb-6 p-4 rounded-xl bg-bg-secondary/30 border border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
                      <Type className="w-4 h-4 text-accent-primary" />
                      字体
                    </label>
                    <select
                      value={options.fontFamily}
                      onChange={(e) =>
                        setOptions({ ...options, fontFamily: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-white/10 text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
                      <Type className="w-4 h-4 text-accent-primary" />
                      字号
                    </label>
                    <select
                      value={options.fontSize}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-white/10 text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    >
                      {FONT_SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s} px
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        options.includeImage
                          ? "bg-accent-primary"
                          : "bg-white/10"
                      }`}
                      onClick={() =>
                        setOptions({
                          ...options,
                          includeImage: !options.includeImage,
                        })
                      }
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          options.includeImage
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm text-text-primary font-medium">
                        同时插入识别原图
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-text-muted mt-1.5 ml-14">
                    在每页文字前插入对应的识别图片，按页对齐
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
              <button
                onClick={handleClose}
                disabled={exporting}
                className="btn-secondary disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-primary disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在生成...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    开始导出
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
