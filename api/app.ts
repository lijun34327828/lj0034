import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express"
import cors from "cors"
import path from "path"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { apiLimiter } from "./middleware/rateLimiter.js"

import uploadRoutes from "./routes/upload.js"
import ocrRoutes from "./routes/ocr.js"
import exportRoutes from "./routes/export.js"
import historyRoutes from "./routes/history.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(apiLimiter)

const distDir = path.join(ROOT_DIR, "dist")
app.use(express.static(distDir))

app.use("/api/upload", uploadRoutes)
app.use("/api/ocr", ocrRoutes)
app.use("/api/export", exportRoutes)
app.use("/api/history", historyRoutes)

app.use(
  "/api/health",
  (req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: "ok",
      data: {
        timestamp: Date.now(),
        uptime: process.uptime(),
      },
    })
  },
)

app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", error)
  res.status(500).json({
    code: 500,
    message: error.message || "服务器内部错误",
  })
})

app.get("*", (req: Request, res: Response) => {
  const indexHtml = path.join(distDir, "index.html")
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(404).json({
        code: 404,
        message: "页面不存在",
      })
    }
  })
})

export default app
