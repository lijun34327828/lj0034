import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");

export const STORAGE_DIR = path.join(ROOT_DIR, "storage");
export const CACHE_DIR = path.join(STORAGE_DIR, "cache", "tasks");
export const EXPORT_DIR = path.join(STORAGE_DIR, "exports");

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getTaskDir(taskId: string): string {
  const taskDir = path.join(CACHE_DIR, taskId);
  ensureDir(taskDir);
  ensureDir(path.join(taskDir, "original"));
  ensureDir(path.join(taskDir, "processed"));
  return taskDir;
}

export function getOriginalImagePath(taskId: string, fileName: string): string {
  return path.join(getTaskDir(taskId), "original", fileName);
}

export function getProcessedImagePath(taskId: string, fileName: string): string {
  return path.join(getTaskDir(taskId), "processed", fileName);
}

export function getResultPath(taskId: string): string {
  return path.join(getTaskDir(taskId), "result.json");
}

export function getTaskInfoPath(taskId: string): string {
  return path.join(getTaskDir(taskId), "task.json");
}

export function getExportPath(fileId: string, format: string): string {
  ensureDir(EXPORT_DIR);
  return path.join(EXPORT_DIR, `${fileId}.${format}`);
}

export function readJsonFile<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function listTaskDirs(): string[] {
  ensureDir(CACHE_DIR);
  return fs
    .readdirSync(CACHE_DIR)
    .filter((name) => fs.statSync(path.join(CACHE_DIR, name)).isDirectory());
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore
  }
}

export function deleteDir(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
}

ensureDir(CACHE_DIR);
ensureDir(EXPORT_DIR);
