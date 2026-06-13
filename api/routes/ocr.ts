import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { ocrLimiter } from "../middleware/rateLimiter.js";
import { taskManager } from "../services/TaskManager.js";
import { ocrService } from "../services/OCRService.js";
import { getTaskDir } from "../lib/storage.js";

const router = Router();

router.post("/:taskId", ocrLimiter, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = taskManager.getTask(taskId);

    if (!task) {
      return res.status(404).json({ code: 404, message: "任务不存在" });
    }

    const taskDir = getTaskDir(taskId);
    const originalDir = path.join(taskDir, "original");

    if (!fs.existsSync(originalDir)) {
      return res
        .status(400)
        .json({ code: 400, message: "未找到上传的图片文件" });
    }

    const files = fs
      .readdirSync(originalDir)
      .filter((f) => /\.(jpg|jpeg|png|bmp|webp|tiff)$/i.test(f))
      .sort();

    if (files.length === 0) {
      return res
        .status(400)
        .json({ code: 400, message: "未找到有效的图片文件" });
    }

    taskManager.updateTaskStatus(taskId, "pending", 0, 0);

    setImmediate(async () => {
      try {
        await ocrService.processTask(taskId, files);
      } catch (error) {
        console.error("OCR 处理失败:", error);
      }
    });

    res.status(200).json({
      code: 200,
      data: { taskId, status: "processing" },
      message: "识别任务已启动",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "识别任务启动失败";
    res.status(500).json({ code: 500, message });
  }
});

router.get("/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = taskManager.getTask(taskId);

    if (!task) {
      return res.status(404).json({ code: 404, message: "任务不存在" });
    }

    res.status(200).json({
      code: 200,
      data: task,
      message: "获取成功",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取任务状态失败";
    res.status(500).json({ code: 500, message });
  }
});

router.get("/:taskId/result", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = taskManager.getResult(taskId);

    if (!result) {
      return res
        .status(404)
        .json({ code: 404, message: "识别结果不存在或未完成" });
    }

    res.status(200).json({
      code: 200,
      data: result,
      message: "获取成功",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取识别结果失败";
    res.status(500).json({ code: 500, message });
  }
});

router.get("/:taskId/image/:pageNumber", async (req: Request, res: Response) => {
  try {
    const { taskId, pageNumber } = req.params;
    const taskDir = getTaskDir(taskId);
    const processedDir = path.join(taskDir, "processed");

    if (!fs.existsSync(processedDir)) {
      return res.status(404).json({ code: 404, message: "图片不存在" });
    }

    const files = fs
      .readdirSync(processedDir)
      .filter((f) => /\.(jpg|jpeg|png|bmp|webp|tiff)$/i.test(f))
      .sort();

    const idx = parseInt(pageNumber, 10) - 1;
    if (idx < 0 || idx >= files.length) {
      return res.status(404).json({ code: 404, message: "页码超出范围" });
    }

    const filePath = path.join(processedDir, files[idx]);
    res.sendFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取图片失败";
    res.status(500).json({ code: 500, message });
  }
});

export default router;
