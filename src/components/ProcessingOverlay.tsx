import { Sparkles, FileImage, Brain, CheckCircle } from "lucide-react";
import { useOCRStore } from "../store/ocrStore.js";

export default function ProcessingOverlay() {
  const { isProcessing, currentTask } = useOCRStore();

  if (!isProcessing) return null;

  const progress = currentTask?.progress ?? 0;
  const currentPage = currentTask?.currentPage ?? 0;
  const totalPages = currentTask?.totalPages ?? 1;

  const steps = [
    { icon: FileImage, label: "图片预处理", threshold: 15 },
    { icon: Brain, label: "AI文字识别", threshold: 50 },
    { icon: Sparkles, label: "排版还原分析", threshold: 85 },
    { icon: CheckCircle, label: "完成", threshold: 100 },
  ];

  const activeStep = steps.findIndex((s) => progress < s.threshold);
  const currentStep = activeStep === -1 ? steps.length - 1 : Math.max(0, activeStep);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary to-cyan-400 animate-pulse-glow" />
            <div className="absolute inset-1 rounded-xl bg-bg-secondary flex items-center justify-center">
              <Brain className="w-10 h-10 text-accent-primary animate-float" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-2">
            正在智能识别
          </h2>
          <p className="text-text-secondary text-sm">
            AI 正在分析您的文档内容，请稍候...
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? "bg-accent-success/20 text-accent-success"
                      : isActive
                      ? "bg-accent-primary/20 text-accent-primary animate-pulse"
                      : "bg-bg-tertiary/50 text-text-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium transition-colors ${
                      isDone || isActive ? "text-text-primary" : "text-text-muted"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isActive && totalPages > 1 && (
                    <p className="text-xs text-text-secondary mt-0.5">
                      第 {currentPage} / {totalPages} 页
                    </p>
                  )}
                </div>
                {isDone && (
                  <CheckCircle className="w-5 h-5 text-accent-success" />
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">处理进度</span>
            <span className="text-accent-primary font-medium">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary via-cyan-400 to-accent-primary bg-[length:200%_100%] animate-shimmer transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
