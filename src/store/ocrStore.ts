import { create } from "zustand";
import type { ExportFormat, OCRResult, OCRTask } from "../../shared/types.js";
import { api } from "../lib/api.js";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

interface OCRState {
  taskId: string | null;
  currentTask: OCRTask | null;
  ocrResult: OCRResult | null;
  uploadedFiles: UploadedFile[];
  currentPage: number;
  editedContent: string;
  isProcessing: boolean;
  error: string | null;
  history: OCRTask[];

  addUploadedFile: (file: File) => void;
  removeUploadedFile: (id: string) => void;
  clearUploadedFiles: () => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;

  setTaskId: (id: string | null) => void;
  setCurrentTask: (task: OCRTask | null) => void;
  setOCRResult: (result: OCRResult | null) => void;
  setCurrentPage: (page: number) => void;
  setEditedContent: (content: string) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;

  loadHistory: () => Promise<void>;
  uploadAndProcess: () => Promise<string | null>;
  pollTaskStatus: (taskId: string) => Promise<void>;
  exportDocument: (format: ExportFormat) => Promise<string | null>;
  resetAll: () => void;
}

function htmlFromOCRResult(result: OCRResult): string {
  return result.pages
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
}

export const useOCRStore = create<OCRState>((set, get) => ({
  taskId: null,
  currentTask: null,
  ocrResult: null,
  uploadedFiles: [],
  currentPage: 1,
  editedContent: "",
  isProcessing: false,
  error: null,
  history: [],

  addUploadedFile: (file: File) => {
    const preview = URL.createObjectURL(file);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, { id, file, preview }],
      error: null,
    }));
  },

  removeUploadedFile: (id: string) => {
    set((state) => {
      const file = state.uploadedFiles.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return {
        uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
      };
    });
  },

  clearUploadedFiles: () => {
    const state = get();
    state.uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    set({ uploadedFiles: [] });
  },

  reorderFiles: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const files = [...state.uploadedFiles];
      const [removed] = files.splice(fromIndex, 1);
      files.splice(toIndex, 0, removed);
      return { uploadedFiles: files };
    });
  },

  setTaskId: (id) => set({ taskId: id }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setOCRResult: (result) => {
    if (result) {
      set({
        ocrResult: result,
        editedContent: htmlFromOCRResult(result),
        currentPage: 1,
      });
    } else {
      set({ ocrResult: null, editedContent: "", currentPage: 1 });
    }
  },
  setCurrentPage: (page) => set({ currentPage: page }),
  setEditedContent: (content) => set({ editedContent: content }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setError: (error) => set({ error }),

  loadHistory: async () => {
    try {
      const history = await api.getHistory(20);
      set({ history });
    } catch (err) {
      console.error("加载历史失败:", err);
    }
  },

  uploadAndProcess: async () => {
    const state = get();
    if (state.uploadedFiles.length === 0) {
      set({ error: "请先上传图片" });
      return null;
    }

    set({ isProcessing: true, error: null });

    try {
      const firstFile = state.uploadedFiles[0].file;
      const { taskId } = await api.createTask(
        firstFile.name,
        state.uploadedFiles.length,
      );

      for (const uploaded of state.uploadedFiles) {
        await api.uploadFile(taskId, uploaded.file);
      }

      await api.startOCR(taskId);
      set({ taskId });
      await get().pollTaskStatus(taskId);
      return taskId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "处理失败";
      set({ error: message, isProcessing: false });
      return null;
    }
  },

  pollTaskStatus: async (taskId: string) => {
    const poll = async (): Promise<void> => {
      const task = await api.getTaskStatus(taskId);
      set({ currentTask: task });

      if (task.status === "completed") {
        const result = await api.getOCRResult(taskId);
        set({
          ocrResult: result,
          editedContent: htmlFromOCRResult(result),
          currentPage: 1,
          isProcessing: false,
        });
      } else if (task.status === "failed") {
        set({
          error: task.error || "识别失败",
          isProcessing: false,
        });
      } else {
        await new Promise((r) => setTimeout(r, 2000));
        return poll();
      }
    };

    await poll();
  },

  exportDocument: async (format: ExportFormat) => {
    const state = get();
    if (!state.taskId) {
      set({ error: "没有可导出的内容" });
      return null;
    }

    try {
      set({ isProcessing: true });
      const result = await api.exportDocument(
        state.taskId,
        format,
        state.editedContent,
      );
      set({ isProcessing: false });
      return result.downloadUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "导出失败";
      set({ error: message, isProcessing: false });
      return null;
    }
  },

  resetAll: () => {
    const state = get();
    state.uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    set({
      taskId: null,
      currentTask: null,
      ocrResult: null,
      uploadedFiles: [],
      currentPage: 1,
      editedContent: "",
      isProcessing: false,
      error: null,
    });
  },
}));
