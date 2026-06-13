import { useEffect } from "react";
import { Clock, Trash2, FileText, CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOCRStore } from "../store/ocrStore.js";
import { api } from "../lib/api.js";
import type { OCRTask } from "../../shared/types.js";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function StatusBadge({ status }: { status: OCRTask["status"] }) {
  const config = {
    pending: {
      label: "等待中",
      icon: Clock,
      className: "bg-slate-500/20 text-text-secondary",
    },
    processing: {
      label: "处理中",
      icon: Loader2,
      className: "bg-accent-primary/20 text-accent-primary",
    },
    completed: {
      label: "已完成",
      icon: CheckCircle2,
      className: "bg-accent-success/20 text-accent-success",
    },
    failed: {
      label: "失败",
      icon: XCircle,
      className: "bg-accent-danger/20 text-accent-danger",
    },
  }[status];

  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}

export default function HistoryList() {
  const navigate = useNavigate();
  const { history, loadHistory } = useOCRStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    await api.deleteTask(taskId);
    loadHistory();
  };

  const handleOpen = async (task: OCRTask) => {
    if (task.status === "completed") {
      const store = useOCRStore.getState();
      store.setTaskId(task.taskId);
      store.setCurrentTask(task);
      await store.pollTaskStatus(task.taskId);
      navigate("/editor");
    }
  };

  if (history.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-bg-tertiary/50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-text-secondary font-medium mb-1">暂无识别记录</h3>
        <p className="text-text-muted text-sm">上传图片开始第一次识别</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent-primary" />
          最近识别记录
        </h3>
        <span className="text-xs text-text-muted">{history.length} 条</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pr-1">
        {history.map((task) => (
          <div
            key={task.taskId}
            onClick={() => handleOpen(task)}
            className={`card p-4 cursor-pointer transition-all duration-200 hover:border-accent-primary/30 hover:-translate-y-0.5 ${
              task.status === "completed" ? "" : "cursor-default opacity-80"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-accent-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-text-primary truncate">
                    {task.originalFileName}
                  </h4>
                  <StatusBadge status={task.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(task.createdAt)}
                  </span>
                  <span>{task.totalPages} 页</span>
                  {task.status === "processing" && (
                    <span className="text-accent-primary">
                      进度 {task.progress}%
                    </span>
                  )}
                </div>

                {task.status === "processing" && (
                  <div className="mt-2 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-primary to-cyan-400 transition-all duration-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {task.status === "completed" && (
                  <button
                    onClick={(e) => handleOpen(task)}
                    className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-accent-primary transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, task.taskId)}
                  className="p-2 rounded-lg hover:bg-accent-danger/10 text-text-secondary hover:text-accent-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
