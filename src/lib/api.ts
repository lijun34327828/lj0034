import type {
  ApiResponse,
  ExportFile,
  ExportFormat,
  OCRResult,
  OCRTask,
} from "../../shared/types.js";

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = (await response.json()) as ApiResponse<T>;
  if (data.code !== 200) {
    throw new Error(data.message || "请求失败");
  }
  return data.data as T;
}

export const api = {
  createTask: async (fileName: string, fileCount: number) => {
    return request<{ taskId: string; uploaded: boolean }>("/api/upload", {
      method: "POST",
      body: JSON.stringify({ fileName, fileCount }),
    });
  },

  uploadFile: async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/file", {
      method: "POST",
      headers: {
        "X-Task-Id": taskId,
      },
      body: formData,
    });

    const data = (await response.json()) as ApiResponse<{
      taskId: string;
      fileName: string;
      fileSize: number;
    }>;
    if (data.code !== 200) {
      throw new Error(data.message || "上传失败");
    }
    return data.data!;
  },

  startOCR: async (taskId: string) => {
    return request<{ taskId: string; status: string }>(`/api/ocr/${taskId}`, {
      method: "POST",
    });
  },

  getTaskStatus: async (taskId: string) => {
    return request<OCRTask>(`/api/ocr/${taskId}`);
  },

  getOCRResult: async (taskId: string) => {
    return request<OCRResult>(`/api/ocr/${taskId}/result`);
  },

  getTaskImage: (taskId: string, pageNumber: number) => {
    return `/api/ocr/${taskId}/image/${pageNumber}`;
  },

  exportDocument: async (
    taskId: string,
    format: ExportFormat,
    editedContent?: string,
  ) => {
    return request<{
      fileId: string;
      fileName: string;
      fileSize: number;
      downloadUrl: string;
    }>(`/api/export/${taskId}`, {
      method: "POST",
      body: JSON.stringify({
        format,
        editedContent,
        options: { includeImage: false },
      }),
    });
  },

  getHistory: async (limit = 20) => {
    return request<OCRTask[]>(`/api/history?limit=${limit}`);
  },

  deleteTask: async (taskId: string) => {
    return request<{ taskId: string }>(`/api/history/${taskId}`, {
      method: "DELETE",
    });
  },
};
