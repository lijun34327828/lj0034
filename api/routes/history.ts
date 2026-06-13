import { Router, type Request, type Response } from "express";
import { taskManager } from "../services/TaskManager.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const tasks = taskManager.listTasks(Math.min(limit, 50));

    res.status(200).json({
      code: 200,
      data: tasks,
      message: "获取成功",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取历史记录失败";
    res.status(500).json({ code: 500, message });
  }
});

router.delete("/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    taskManager.deleteTask(taskId);

    res.status(200).json({
      code: 200,
      data: { taskId },
      message: "删除成功",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    res.status(500).json({ code: 500, message });
  }
});

export default router;
