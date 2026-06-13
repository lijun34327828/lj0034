import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import PDFDocument from "pdfkit";
import type {
  ExportFile,
  ExportFormat,
  ExportRequest,
  OCRResult,
} from "../../shared/types.js";
import { taskManager } from "./TaskManager.js";
import { getExportPath, writeJsonFile } from "../lib/storage.js";

function getPlainText(result: OCRResult, editedContent?: string): string {
  if (editedContent) {
    return editedContent.replace(/<[^>]*>/g, "");
  }
  return result.pages
    .map((page) => page.blocks.map((b) => b.text).join("\n"))
    .join("\n\n--- 分页 ---\n\n");
}

function getMarkdown(result: OCRResult, editedContent?: string): string {
  if (editedContent) {
    return editedContent;
  }
  return result.pages
    .map(
      (page, idx) =>
        `## 第 ${idx + 1} 页\n\n` +
        page.blocks
          .map((b, i, arr) => {
            if (i > 0 && b.paragraphIndex !== arr[i - 1].paragraphIndex) {
              return "\n\n" + b.text;
            }
            return b.text;
          })
          .join("\n"),
    )
    .join("\n\n---\n\n");
}

async function exportDocx(
  result: OCRResult,
  editedContent?: string,
): Promise<Buffer> {
  const children: Paragraph[] = [];
  const text = editedContent
    ? editedContent.replace(/<[^>]*>/g, "")
    : result.pages
        .map((page) => page.blocks.map((b) => b.text).join("\n"))
        .join("\n\n--- 分页 ---\n\n");

  const paragraphs = text.split("\n");
  paragraphs.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("---")) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", break: 1 })],
          pageBreakBefore: true,
        }),
      );
    } else if (trimmed.startsWith("# ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: trimmed.slice(2) })],
        }),
      );
    } else if (trimmed.startsWith("## ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: trimmed.slice(3) })],
        }),
      );
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: line })],
        }),
      );
    }
  });

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

function exportPdf(result: OCRResult, editedContent?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(12);
    const text = editedContent
      ? editedContent.replace(/<[^>]*>/g, "")
      : result.pages
          .map((page) => page.blocks.map((b) => b.text).join("\n"))
          .join("\n\n--- 分页 ---\n\n");

    const pages = text.split("--- 分页 ---");
    pages.forEach((pageContent, idx) => {
      if (idx > 0) doc.addPage();
      doc.text(pageContent.trim(), { align: "left", lineGap: 4 });
    });

    doc.end();
  });
}

export class ExportService {
  async export(request: ExportRequest): Promise<ExportFile> {
    const { taskId, format, options, editedContent } = request;
    const result = taskManager.getResult(taskId);
    if (!result) {
      throw new Error("识别结果不存在");
    }

    const fileId = uuidv4();
    const fileName = `${result.metadata.originalFileName.replace(/\.[^.]+$/, "")}.${format}`;
    const filePath = getExportPath(fileId, format);

    let content: Buffer;
    switch (format) {
      case "docx":
        content = await exportDocx(result, editedContent);
        break;
      case "pdf":
        content = await exportPdf(result, editedContent);
        break;
      case "txt":
        content = Buffer.from(getPlainText(result, editedContent), "utf-8");
        break;
      case "md":
        content = Buffer.from(getMarkdown(result, editedContent), "utf-8");
        break;
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }

    fs.writeFileSync(filePath, content);

    const exportFile: ExportFile = {
      fileId,
      taskId,
      format,
      fileName,
      fileSize: content.length,
      filePath,
      createdAt: Date.now(),
    };

    const metaPath = filePath + ".meta.json";
    writeJsonFile(metaPath, exportFile);

    return exportFile;
  }

  getExportFile(fileId: string, format: ExportFormat): ExportFile | null {
    const metaPath = getExportPath(fileId, format) + ".meta.json";
    try {
      if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const exportService = new ExportService();
