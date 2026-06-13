export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export type ExportFormat = "docx" | "pdf" | "txt" | "md";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextBlock {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  lineNumber: number;
  paragraphIndex: number;
}

export interface OCRPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: TextBlock[];
  imagePath: string;
}

export interface OCRTask {
  taskId: string;
  originalFileName: string;
  status: TaskStatus;
  progress: number;
  totalPages: number;
  currentPage: number;
  language: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export interface OCRResult {
  taskId: string;
  pages: OCRPage[];
  metadata: {
    originalFileName: string;
    totalPages: number;
    language: string;
    createdAt: number;
  };
}

export interface ExportRequest {
  taskId: string;
  format: ExportFormat;
  options: {
    includeImage: boolean;
    fontSize?: number;
    fontFamily?: string;
    pageMargin?: number;
  };
  editedContent?: string;
}

export interface ExportFile {
  fileId: string;
  taskId: string;
  format: ExportFormat;
  fileName: string;
  fileSize: number;
  filePath: string;
  createdAt: number;
}

export interface ApiResponse<T = unknown> {
  code: number;
  data?: T;
  message: string;
}

export interface UploadResponse {
  taskId: string;
  fileName: string;
  fileSize: number;
  chunkIndex?: number;
  totalChunks?: number;
  uploaded: boolean;
}

export interface ImagePreprocessOptions {
  contrast?: number;
  brightness?: number;
  rotation?: number;
  deskew?: boolean;
}
