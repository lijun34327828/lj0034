import { Router, type Request, type Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { taskManager } from "../services/TaskManager.js";
import { getOriginalImagePath } from "../lib/storage.js";
import fs from "node:fs";

const router = Router();

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskId = (req as any).taskId as string;
    if (!taskId) {
      return cb(new Error("taskId 不存在"), "");
    }
    const dir = getOriginalImagePath(taskId, file.originalname);
    cb(null, path.dirname(dir));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件格式"));
    }
  },
});

router.post("/", uploadLimiter, async (req: Request, res: Response) => {
  try {
    const taskId = (req.body as any).taskId || uuidv4();
    (req as any).taskId = taskId;

    const originalFileName = (req.body as any).fileName || "未命名图片";
    const fileCount = parseInt((req.body as any).fileCount || "1", 10);

    if (!taskManager.getTask(taskId)) {
      taskManager.createTask(originalFileName, fileCount);
    }

    res.status(200).json({
      code: 200,
      data: { taskId, uploaded: true },
      message: "任务创建成功",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败";
    res.status(400).json({ code: 400, message });
  }
});

router.post(
  "/file",
  uploadLimiter,
  (req: Request, res: Response, next) => {
    const taskId = req.headers["x-task-id"] as string;
    if (!taskId) {
      return res
        .status(400)
        .json({ code: 400, message: "缺少 taskId" });
    }
    (req as any).taskId = taskId;
    next();
  },
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ code: 400, message: "未接收到文件" });
      }

      const taskId = (req as any).taskId as string;

      res.status(200).json({
        code: 200,
        data: {
          taskId,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploaded: true,
        },
        message: "文件上传成功",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "文件上传失败";
      res.status(400).json({ code: 400, message });
    }
  },
);

export default router;
