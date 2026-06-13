import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import { exportService } from "../services/ExportService.js";
import type { ExportRequest } from "../../shared/types.js";

const router = Router();

router.post("/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const body = req.body as Partial<ExportRequest>;

    if (!body.format) {
      return res
        .status(400)
        .json({ code: 400, message: "缺少导出格式参数" });
    }

    const request: ExportRequest = {
      taskId,
      format: body.format,
      options: {
        includeImage: body.options?.includeImage ?? false,
        fontSize: body.options?.fontSize ?? 14,
        fontFamily: body.options?.fontFamily ?? "Noto Sans SC",
        pageMargin: body.options?.pageMargin ?? 50,
      },
      editedContent: body.editedContent,
    };

    const file = await exportService.export(request);

    res.status(200).json({
      code: 200,
      data: {
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        downloadUrl: `/api/export/${file.fileId}/download?format=${file.format}`,
      },
      message: "导出成功",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败";
    res.status(500).json({ code: 500, message });
  }
});

router.get("/:fileId/download", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const format = (req.query.format as string) || "txt";

    const validFormats = ["docx", "pdf", "txt", "md"];
    if (!validFormats.includes(format)) {
      return res
        .status(400)
        .json({ code: 400, message: "不支持的文件格式" });
    }

    const meta = exportService.getExportFile(fileId, format as any);
    if (!meta) {
      return res
        .status(404)
        .json({ code: 404, message: "文件不存在或已过期" });
    }

    if (!fs.existsSync(meta.filePath)) {
      return res
        .status(404)
        .json({ code: 404, message: "文件不存在" });
    }

    res.download(meta.filePath, meta.fileName, (err) => {
      if (err) {
        console.error("下载失败:", err);
        res.status(500).json({ code: 500, message: "下载失败" });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "下载失败";
    res.status(500).json({ code: 500, message });
  }
});

export default router;
