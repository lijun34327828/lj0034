import { v4 as uuidv4 } from "uuid";
import type { OCRTask, OCRResult, TaskStatus } from "../../shared/types.js";
import {
  getTaskInfoPath,
  getResultPath,
  listTaskDirs,
  readJsonFile,
  writeJsonFile,
  deleteDir,
  getTaskDir,
} from "../lib/storage.js";

export class TaskManager {
  createTask(originalFileName: string, totalPages: number = 1): OCRTask {
    const task: OCRTask = {
      taskId: uuidv4(),
      originalFileName,
      status: "pending",
      progress: 0,
      totalPages,
      currentPage: 0,
      language: "chi_sim+eng",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.saveTask(task);
    return task;
  }

  getTask(taskId: string): OCRTask | null {
    return readJsonFile<OCRTask>(getTaskInfoPath(taskId));
  }

  saveTask(task: OCRTask): void {
    task.updatedAt = Date.now();
    writeJsonFile(getTaskInfoPath(task.taskId), task);
  }

  updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    progress?: number,
    currentPage?: number,
  ): OCRTask | null {
    const task = this.getTask(taskId);
    if (!task) return null;
    task.status = status;
    if (progress !== undefined) task.progress = progress;
    if (currentPage !== undefined) task.currentPage = currentPage;
    this.saveTask(task);
    return task;
  }

  setTaskError(taskId: string, error: string): OCRTask | null {
    const task = this.getTask(taskId);
    if (!task) return null;
    task.status = "failed";
    task.error = error;
    this.saveTask(task);
    return task;
  }

  saveResult(result: OCRResult): void {
    writeJsonFile(getResultPath(result.taskId), result);
  }

  getResult(taskId: string): OCRResult | null {
    return readJsonFile<OCRResult>(getResultPath(taskId));
  }

  listTasks(limit: number = 20): OCRTask[] {
    const taskIds = listTaskDirs();
    const tasks: OCRTask[] = [];
    for (const id of taskIds) {
      const task = this.getTask(id);
      if (task) tasks.push(task);
    }
    return tasks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  deleteTask(taskId: string): boolean {
    const taskDir = getTaskDir(taskId);
    deleteDir(taskDir);
    return true;
  }
}

export const taskManager = new TaskManager();
