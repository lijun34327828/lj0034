import sharp from "sharp";
import fs from "node:fs";
import type { ImagePreprocessOptions } from "../../shared/types.js";
import {
  getOriginalImagePath,
  getProcessedImagePath,
} from "../lib/storage.js";

export class ImageProcessor {
  async preprocess(
    taskId: string,
    fileName: string,
    options: ImagePreprocessOptions = {},
  ): Promise<{ processedPath: string; width: number; height: number }> {
    const inputPath = getOriginalImagePath(taskId, fileName);
    const outputPath = getProcessedImagePath(taskId, fileName);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`原始图片不存在: ${fileName}`);
    }

    let pipeline = sharp(inputPath);

    if (options.rotation && options.rotation !== 0) {
      pipeline = pipeline.rotate(options.rotation);
    }

    if (options.brightness !== undefined) {
      pipeline = pipeline.modulate({ brightness: options.brightness });
    }

    if (options.contrast !== undefined) {
      const contrast = options.contrast;
      const intercept = 128 * (1 - contrast);
      pipeline = pipeline.linear(contrast, intercept);
    }

    pipeline = pipeline.normalize().sharpen();

    const { data, info } = await pipeline
      .png({ quality: 90, compressionLevel: 6 })
      .toBuffer({ resolveWithObject: true });

    fs.writeFileSync(outputPath, data);

    return {
      processedPath: outputPath,
      width: info.width,
      height: info.height,
    };
  }

  async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  async createThumbnail(
    inputPath: string,
    outputPath: string,
    width: number = 200,
  ): Promise<void> {
    await sharp(inputPath).resize(width, null, { fit: "inside" }).jpeg({ quality: 80 }).toFile(outputPath);
  }
}

export const imageProcessor = new ImageProcessor();
