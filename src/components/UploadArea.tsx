import { useCallback, useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  ChevronUp,
  ChevronDown,
  Camera,
  FilePlus,
} from "lucide-react";
import { useOCRStore } from "../store/ocrStore.js";

export default function UploadArea() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const {
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    reorderFiles,
    clearUploadedFiles,
    isProcessing,
    uploadAndProcess,
  } = useOCRStore();

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const validTypes = ["image/jpeg", "image/png", "image/bmp", "image/webp", "image/tiff"];
      Array.from(files).forEach((file) => {
        if (validTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|bmp|webp|tiff)$/i)) {
          addUploadedFile(file);
        }
      });
    },
    [addUploadedFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < uploadedFiles.length) {
      reorderFiles(index, newIndex);
    }
  };

  return (
    <div className="w-full animate-fade-in-up">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-10 transition-all duration-300 overflow-hidden
          ${
            isDragging
              ? "border-accent-primary bg-accent-primary/5 scale-[1.01]"
              : "border-slate-600/40 hover:border-accent-primary/60 bg-bg-secondary/30 hover:bg-bg-secondary/50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />

        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-30 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center gap-6 py-6">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
              ${
                isDragging
                  ? "bg-accent-primary text-bg-primary scale-110 animate-pulse-glow"
                  : "bg-bg-tertiary text-accent-primary"
              }`}
          >
            <Upload className="w-10 h-10" />
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold text-text-primary mb-2">
              {isDragging ? "松开以上传图片" : "拖拽图片到此处"}
            </p>
            <p className="text-text-secondary text-sm">
              或点击选择文件，支持 JPG、PNG、BMP、WEBP、TIFF 格式
            </p>
            <p className="text-text-muted text-xs mt-2">
              支持多图连续上传，单张不超过 20MB
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="btn-primary"
            >
              <FilePlus className="w-4 h-4" />
              选择图片
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.setAttribute("capture", "environment");
                inputRef.current?.click();
                inputRef.current?.removeAttribute("capture");
              }}
              className="btn-secondary"
            >
              <Camera className="w-4 h-4" />
              拍照上传
            </button>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-accent-primary" />
              已上传 {uploadedFiles.length} 张图片
            </h3>
            {!isProcessing && (
              <button onClick={clearUploadedFiles} className="btn-ghost text-sm">
                <X className="w-4 h-4" />
                清空
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
            {uploadedFiles.map((f, idx) => (
              <div
                key={f.id}
                className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-bg-secondary/50 border border-slate-600/30 group animate-fade-in"
              >
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-bg-primary/80 flex items-center justify-center text-xs font-medium text-text-primary">
                  {idx + 1}
                </div>
                {!isProcessing && (
                  <>
                    <button
                      onClick={() => removeUploadedFile(f.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveFile(idx, -1)}
                        disabled={idx === 0}
                        className="w-6 h-6 rounded-md bg-bg-primary/80 text-text-primary flex items-center justify-center disabled:opacity-30 hover:bg-accent-primary hover:text-bg-primary transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === uploadedFiles.length - 1}
                        className="w-6 h-6 rounded-md bg-bg-primary/80 text-text-primary flex items-center justify-center disabled:opacity-30 hover:bg-accent-primary hover:text-bg-primary transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={uploadAndProcess}
              disabled={isProcessing}
              className="btn-primary text-base px-10 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  正在识别中...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  开始识别
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
