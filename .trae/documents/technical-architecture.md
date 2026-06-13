## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React)"
        A["上传组件 Uploader"]
        B["图片预览 Previewer"]
        C["富文本编辑器 Editor"]
        D["样式工具栏 Toolbar"]
        E["分页管理器 Pagination"]
        F["导出面板 Exporter"]
    end
    subgraph "后端 (Express :8724)"
        G["API路由层 Routes"]
        H["请求限流 Middleware"]
        I["图片预处理 Service"]
        J["OCR识别 Service"]
        K["版面分析 Service"]
        L["文件缓存 Manager"]
        M["文档导出 Service"]
    end
    subgraph "数据存储"
        N["缓存分区 Storage"]
        O["临时文件区"]
        P["导出文件区"]
    end
    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> N
    F --> M
    M --> P
```

## 2. 技术描述

- **前端**：React@18 + TypeScript + Vite + TailwindCSS@3
- **富文本编辑**：TipTap (基于 ProseMirror)
- **后端**：Node.js + Express@4 + TypeScript
- **OCR引擎**：Tesseract.js (JavaScript本地OCR，支持中文识别)
- **图像处理**：Sharp (图片预处理、缩放、旋转、对比度调整)
- **文档导出**：docx (Word导出)、pdfkit (PDF导出)
- **文件上传**：Multer (分片上传支持)
- **请求限流**：express-rate-limit
- **缓存存储**：本地文件系统独立分区 (`./storage/cache`)
- **并发处理**：Worker Threads (OCR识别多线程)

## 3. 路由定义

| 路由 | 方法 | 用途 |
|------|------|------|
| / | GET | 前端静态页面 |
| /api/upload | POST | 上传图片（支持分片） |
| /api/ocr/:taskId | POST | 执行OCR识别 |
| /api/tasks/:taskId | GET | 查询识别任务状态 |
| /api/tasks/:taskId/result | GET | 获取识别结果 |
| /api/export/:taskId | POST | 导出文档 |
| /api/export/:fileId/download | GET | 下载导出文件 |
| /api/history | GET | 获取识别历史记录 |

## 4. API 定义

### 4.1 类型定义

```typescript
// 上传响应
interface UploadResponse {
  taskId: string;
  fileName: string;
  fileSize: number;
  chunkIndex?: number;
  totalChunks?: number;
  uploaded: boolean;
}

// OCR任务状态
interface OCRTask {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalPages: number;
  currentPage: number;
  createdAt: number;
  updatedAt: number;
}

// 识别结果数据结构
interface OCRResult {
  taskId: string;
  pages: OCRPage[];
  metadata: {
    originalFileName: string;
    totalPages: number;
    language: string;
    createdAt: number;
  };
}

interface OCRPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: TextBlock[];
  imageUrl: string;
}

interface TextBlock {
  id: string;
  text: string;
  confidence: number;
  boundingBox: {
    x: number; y: number; width: number; height: number;
  };
  lineNumber: number;
  paragraphIndex: number;
}

// 导出请求
interface ExportRequest {
  taskId: string;
  format: 'docx' | 'pdf' | 'txt' | 'md';
  options: {
    includeImage: boolean;
    fontSize?: number;
    fontFamily?: string;
    pageMargin?: number;
  };
}

interface ExportResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
}
```

### 4.2 请求响应结构

- 所有API响应统一格式：`{ code: number, data: any, message: string }`
- 错误码：200成功 / 400参数错误 / 429限流 / 500服务错误
- 限流规则：每分钟最多30次请求，单IP并发最多3个识别任务

## 5. 服务器架构

```mermaid
graph LR
    A["客户端请求"] --> B["Rate Limiter 限流中间件"]
    B --> C["Multer 文件解析"]
    C --> D["路由控制器 Controller"]
    D --> E["业务服务层 Service"]
    E --> F["OCR Worker 线程池"]
    E --> G["图像处理 Sharp"]
    E --> H["缓存管理 CacheManager"]
    H --> I["文件系统 Storage"]
    E --> J["文档生成 ExportService"]
    J --> I
```

## 6. 数据模型

### 6.1 数据结构

```mermaid
erDiagram
    OCR_TASK ||--o{ OCR_PAGE : contains
    OCR_PAGE ||--o{ TEXT_BLOCK : contains
    OCR_TASK ||--o{ EXPORT_FILE : exports

    OCR_TASK {
        string taskId PK
        string originalFileName
        string status
        number progress
        number totalPages
        string language
        number createdAt
        number updatedAt
    }

    OCR_PAGE {
        string pageId PK
        string taskId FK
        number pageNumber
        number width
        number height
        string imagePath
    }

    TEXT_BLOCK {
        string blockId PK
        string pageId FK
        string text
        number confidence
        number posX
        number posY
        number posWidth
        number posHeight
        number lineNumber
        number paragraphIndex
    }

    EXPORT_FILE {
        string fileId PK
        string taskId FK
        string format
        string fileName
        number fileSize
        string filePath
        number createdAt
    }
```

### 6.2 本地存储结构

```
storage/
├── cache/                 # 文件缓存独立分区
│   └── tasks/             # 任务缓存
│       └── {taskId}/
│           ├── original/  # 原始图片
│           ├── processed/ # 预处理后图片
│           └── result.json
└── exports/               # 导出文件区
    └── {fileId}.{format}
```
