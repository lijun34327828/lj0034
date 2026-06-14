import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  ImageRun,
  PageNumber,
  WidthType,
  TabStopType,
  TabStopPosition,
} from "docx";
import PDFDocument from "pdfkit";
import type {
  ExportFile,
  ExportFormat,
  ExportRequest,
  OCRResult,
  OCRPage,
} from "../../shared/types.js";
import { taskManager } from "./TaskManager.js";
import { getExportPath, writeJsonFile } from "../lib/storage.js";

const TTF_FONT_PATH_MAP: Record<string, string> = {
  "Noto Sans SC": "C:\\Windows\\Fonts\\NotoSansSC-VF.ttf",
  SimHei: "C:\\Windows\\Fonts\\simhei.ttf",
  SimSun: "C:\\Windows\\Fonts\\simsunb.ttf",
  FangSong: "C:\\Windows\\Fonts\\simfang.ttf",
  KaiTi: "C:\\Windows\\Fonts\\simkai.ttf",
  "Microsoft YaHei": "C:\\Windows\\Fonts\\simhei.ttf",
};

const DOCX_FONT_NAME_MAP: Record<string, string> = {
  "Noto Sans SC": "Noto Sans SC",
  SimHei: "SimHei",
  SimSun: "SimSun",
  FangSong: "FangSong",
  KaiTi: "KaiTi",
  "Microsoft YaHei": "Microsoft YaHei",
};

function getAvailableFontPath(fontFamily: string): string {
  const candidates = [
    TTF_FONT_PATH_MAP[fontFamily],
    "C:\\Windows\\Fonts\\NotoSansSC-VF.ttf",
    "C:\\Windows\\Fonts\\simhei.ttf",
    "C:\\Windows\\Fonts\\simfang.ttf",
    "C:\\Windows\\Fonts\\simkai.ttf",
    "C:\\Windows\\Fonts\\simsunb.ttf",
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return "C:\\Windows\\Fonts\\simhei.ttf";
}

function getDocxFontName(fontFamily: string): string {
  return DOCX_FONT_NAME_MAP[fontFamily] || "SimHei";
}

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

function parseEditedContentByPage(
  editedContent: string,
  totalPages: number,
): string[] {
  const stripped = editedContent.replace(/<[^>]*>/g, "");
  const parts = stripped.split(/---\s*分页\s*---/);
  if (parts.length >= totalPages) {
    return parts.slice(0, totalPages).map((p) => p.trim());
  }
  const pages: string[] = [];
  const lines = stripped.split("\n");
  const perPage = Math.ceil(lines.length / totalPages);
  for (let i = 0; i < totalPages; i++) {
    pages.push(
      lines.slice(i * perPage, (i + 1) * perPage).join("\n").trim(),
    );
  }
  return pages;
}

function getPageTexts(
  result: OCRResult,
  editedContent?: string,
): string[] {
  if (editedContent) {
    return parseEditedContentByPage(editedContent, result.pages.length);
  }
  return result.pages.map((page) =>
    page.blocks.map((b) => b.text).join("\n"),
  );
}

async function exportDocx(
  result: OCRResult,
  options: { fontSize: number; fontFamily: string; includeImage: boolean },
  editedContent?: string,
): Promise<Buffer> {
  const { fontSize, fontFamily, includeImage } = options;
  const fontName = getDocxFontName(fontFamily);
  const pageTexts = getPageTexts(result, editedContent);
  const originalFileName = result.metadata.originalFileName;
  const totalPages = result.pages.length;

  const sections = [];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const children: Paragraph[] = [];
    const page = result.pages[pageIdx];
    const text = pageTexts[pageIdx] || "";

    if (includeImage && page.imagePath && fs.existsSync(page.imagePath)) {
      try {
        const imageBuffer = fs.readFileSync(page.imagePath) as unknown as Uint8Array;
        const maxWidth = 600;
        const scale = Math.min(1, maxWidth / page.width);
        const imgWidth = Math.floor(page.width * scale);
        const imgHeight = Math.floor(page.height * scale);
        const ext = path.extname(page.imagePath).toLowerCase();
        let imgType: "jpg" | "png" | "bmp" | "gif" | "tif" = "png";
        if (ext === ".jpg" || ext === ".jpeg") imgType = "jpg";
        else if (ext === ".png") imgType = "png";
        else if (ext === ".bmp") imgType = "bmp";
        else if (ext === ".gif") imgType = "gif";
        else if (ext === ".tif" || ext === ".tiff") imgType = "tif";

        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: imgWidth,
                  height: imgHeight,
                },
                type: imgType,
              } as any),
            ],
          }),
        );
      } catch {
        // 图片插入失败，跳过
      }
    }

    const paragraphs = text.split("\n");
    paragraphs.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: trimmed.slice(2),
                size: fontSize * 2,
                font: { name: fontName, eastAsia: fontName },
              }),
            ],
          }),
        );
      } else if (trimmed.startsWith("## ")) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: trimmed.slice(3),
                size: fontSize * 2,
                font: { name: fontName, eastAsia: fontName },
              }),
            ],
          }),
        );
      } else {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 276, after: 60 },
            children: [
              new TextRun({
                text: line,
                size: fontSize * 2,
                font: { name: fontName, eastAsia: fontName },
              }),
            ],
          }),
        );
      }
    });

    const header = new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: {
            bottom: { style: "single", size: 6, color: "CCCCCC" },
          },
          children: [
            new TextRun({
              text: originalFileName,
              size: 18,
              font: { name: fontName, eastAsia: fontName },
              color: "666666",
            }),
          ],
        }),
      ],
    });

    const footer = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: {
            top: { style: "single", size: 6, color: "CCCCCC" },
          },
          tabStops: [
            {
              type: TabStopType.CENTER,
              position: TabStopPosition.MAX / 2,
            },
          ],
          children: [
            new TextRun({
              text: "第 ",
              size: 18,
              font: { name: fontName, eastAsia: fontName },
              color: "666666",
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: 18,
              font: { name: fontName, eastAsia: fontName },
              color: "666666",
            }),
            new TextRun({
              text: " 页 / 共 ",
              size: 18,
              font: { name: fontName, eastAsia: fontName },
              color: "666666",
            }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              size: 18,
              font: { name: fontName, eastAsia: fontName },
              color: "666666",
            }),
            new TextRun({
              text: " 页",
              size: 18,
              font: { name: fontName, eastAsia: fontName },
              color: "666666",
            }),
          ],
        }),
      ],
    });

    sections.push({
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      headers: {
        default: header,
      },
      footers: {
        default: footer,
      },
      children,
    });
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: fontSize * 2,
            font: { name: fontName, eastAsia: fontName },
          },
        },
      },
    },
    sections,
  });

  return Packer.toBuffer(doc);
}

function exportPdf(
  result: OCRResult,
  options: { fontSize: number; fontFamily: string; includeImage: boolean },
  editedContent?: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { fontSize, fontFamily, includeImage } = options;
    const fontPath = getAvailableFontPath(fontFamily);
    const pageTexts = getPageTexts(result, editedContent);
    const originalFileName = result.metadata.originalFileName;
    const totalPages = result.pages.length;

    const margin = 50;
    const doc = new PDFDocument({ margin, size: "A4", autoFirstPage: false });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      doc.registerFont("zh-font", fontPath);
    } catch (err) {
      reject(err);
      return;
    }

    doc.font("zh-font");

    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;
    const pageWidth = A4_WIDTH;
    const pageHeight = A4_HEIGHT;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 30;
    const footerHeight = 30;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      doc.addPage();

      doc.fontSize(9);
      doc.fillColor("#666666");
      doc.text(originalFileName, margin, margin - 10, {
        width: contentWidth,
        align: "center",
      });

      doc.moveTo(margin, margin + 12);
      doc.lineTo(pageWidth - margin, margin + 12);
      doc.lineWidth(0.5);
      doc.strokeColor("#CCCCCC");
      doc.stroke();

      const page = result.pages[pageIdx];
      let currentY = margin + headerHeight + 10;

      if (includeImage && page.imagePath && fs.existsSync(page.imagePath)) {
        try {
          const maxImgWidth = contentWidth;
          const maxImgHeight = pageHeight / 2.5;
          const imgRatio = page.width / page.height;
          let imgWidth = maxImgWidth;
          let imgHeight = imgWidth / imgRatio;
          if (imgHeight > maxImgHeight) {
            imgHeight = maxImgHeight;
            imgWidth = imgHeight * imgRatio;
          }
          const imgX = margin + (contentWidth - imgWidth) / 2;

          doc.image(page.imagePath, imgX, currentY, {
            width: imgWidth,
            height: imgHeight,
          });
          currentY += imgHeight + 20;
        } catch {
          // 图片插入失败，跳过
        }
      }

      doc.fontSize(fontSize);
      doc.fillColor("#000000");

      const text = pageTexts[pageIdx] || "";
      const availableHeight = pageHeight - margin - footerHeight - currentY - 20;

      doc.text(text, margin, currentY, {
        width: contentWidth,
        align: "left",
        lineGap: 4,
        height: availableHeight,
      });

      const footerY = pageHeight - margin - 10;
      doc.moveTo(margin, footerY - 12);
      doc.lineTo(pageWidth - margin, footerY - 12);
      doc.lineWidth(0.5);
      doc.strokeColor("#CCCCCC");
      doc.stroke();

      doc.fontSize(9);
      doc.fillColor("#666666");
      doc.text(`第 ${pageIdx + 1} 页 / 共 ${totalPages} 页`, margin, footerY, {
        width: contentWidth,
        align: "center",
      });
    }

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

    const exportOpts = {
      fontSize: options?.fontSize ?? 14,
      fontFamily: options?.fontFamily ?? "Noto Sans SC",
      includeImage: options?.includeImage ?? false,
    };

    const fileId = uuidv4();
    const fileName = `${result.metadata.originalFileName.replace(/\.[^.]+$/, "")}.${format}`;
    const filePath = getExportPath(fileId, format);

    let content: Buffer;
    switch (format) {
      case "docx":
        content = await exportDocx(result, exportOpts, editedContent);
        break;
      case "pdf":
        content = await exportPdf(result, exportOpts, editedContent);
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
