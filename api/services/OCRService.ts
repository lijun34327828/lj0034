import { createWorker, type Worker, type Page } from "tesseract.js";
import { v4 as uuidv4 } from "uuid";
import type { OCRPage, OCRResult, TextBlock } from "../../shared/types.js";
import { taskManager } from "./TaskManager.js";
import { imageProcessor } from "./ImageProcessor.js";
import { getProcessedImagePath } from "../lib/storage.js";

class OCRService {
  private worker: Worker | null = null;

  private async initWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = await createWorker(["chi_sim", "eng"]);
    }
    return this.worker;
  }

  private async recognizeImage(
    imagePath: string,
  ): Promise<{ blocks: TextBlock[]; width: number; height: number }> {
    const worker = await this.initWorker();
    const { data } = await worker.recognize(imagePath);
    const blocks: TextBlock[] = [];

    if (data.lines) {
      data.lines.forEach((line, lineIdx) => {
        const paragraphIdx = Math.floor(lineIdx / 3);
        line.words.forEach((word) => {
          if (word.text.trim()) {
            blocks.push({
              id: uuidv4(),
              text: word.text,
              confidence: word.confidence / 100,
              boundingBox: {
                x: word.bbox.x0,
                y: word.bbox.y0,
                width: word.bbox.x1 - word.bbox.x0,
                height: word.bbox.y1 - word.bbox.y0,
              },
              lineNumber: lineIdx,
              paragraphIndex: paragraphIdx,
            });
          }
        });
      });
    }

    const { width, height } = await imageProcessor.getImageDimensions(imagePath);

    return { blocks, width, height };
  }

  private assembleTextBlocks(blocks: TextBlock[]): TextBlock[] {
    if (blocks.length === 0) return blocks;

    const sorted = [...blocks].sort((a, b) => {
      if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
      return a.boundingBox.x - b.boundingBox.x;
    });

    const lineGroups = new Map<number, TextBlock[]>();
    sorted.forEach((block) => {
      const line = block.lineNumber;
      if (!lineGroups.has(line)) lineGroups.set(line, []);
      lineGroups.get(line)!.push(block);
    });

    const merged: TextBlock[] = [];
    lineGroups.forEach((lineBlocks, lineNumber) => {
      if (lineBlocks.length === 0) return;
      const sortedByX = lineBlocks.sort((a, b) => a.boundingBox.x - b.boundingBox.x);
      const x0 = sortedByX[0].boundingBox.x;
      const y0 = Math.min(...sortedByX.map((b) => b.boundingBox.y));
      const x1 = Math.max(
        ...sortedByX.map((b) => b.boundingBox.x + b.boundingBox.width),
      );
      const y1 = Math.max(
        ...sortedByX.map((b) => b.boundingBox.y + b.boundingBox.height),
      );

      merged.push({
        id: uuidv4(),
        text: sortedByX.map((b) => b.text).join(" "),
        confidence:
          sortedByX.reduce((sum, b) => sum + b.confidence, 0) / sortedByX.length,
        boundingBox: {
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
        },
        lineNumber,
        paragraphIndex: sortedByX[0].paragraphIndex,
      });
    });

    return merged.sort((a, b) => a.lineNumber - b.lineNumber);
  }

  async processTask(taskId: string, fileNames: string[]): Promise<OCRResult> {
    taskManager.updateTaskStatus(taskId, "processing", 0, 0);

    try {
      const pages: OCRPage[] = [];
      const total = fileNames.length;

      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        const { processedPath } = await imageProcessor.preprocess(
          taskId,
          fileName,
          { contrast: 1.2, brightness: 1.1 },
        );

        const { blocks, width, height } = await this.recognizeImage(processedPath);
        const mergedBlocks = this.assembleTextBlocks(blocks);

        pages.push({
          pageNumber: i + 1,
          width,
          height,
          blocks: mergedBlocks,
          imagePath: getProcessedImagePath(taskId, fileName),
        });

        const progress = Math.round(((i + 1) / total) * 100);
        taskManager.updateTaskStatus(taskId, "processing", progress, i + 1);
      }

      const task = taskManager.getTask(taskId)!;
      const result: OCRResult = {
        taskId,
        pages,
        metadata: {
          originalFileName: task.originalFileName,
          totalPages: pages.length,
          language: task.language,
          createdAt: Date.now(),
        },
      };

      taskManager.saveResult(result);
      taskManager.updateTaskStatus(taskId, "completed", 100, total);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      taskManager.setTaskError(taskId, message);
      throw error;
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService();
