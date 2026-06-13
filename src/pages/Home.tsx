import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ScanText, Layers, Wand2, FileOutput, ShieldCheck } from "lucide-react";
import UploadArea from "../components/UploadArea.js";
import HistoryList from "../components/HistoryList.js";
import { useOCRStore } from "../store/ocrStore.js";

const FEATURES = [
  {
    icon: ScanText,
    title: "智能文字识别",
    desc: "AI 驱动的 OCR 引擎，精准识别中文手写、印刷体内容",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Layers,
    title: "原排版还原",
    desc: "智能分析版面结构，精确保留原有分行、段落布局",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Wand2,
    title: "图片预处理",
    desc: "自动倾斜校正、暗光增强，兼容各种拍摄条件",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: FileOutput,
    title: "多格式导出",
    desc: "支持 Word、PDF、Markdown、TXT 四种文档格式",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: ShieldCheck,
    title: "本地安全处理",
    desc: "文件缓存独立分区存储，保障您的数据隐私安全",
    color: "from-rose-500 to-red-500",
  },
  {
    icon: Sparkles,
    title: "在线编辑纠错",
    desc: "富文本编辑器实时校对，调整字体样式和段落格式",
    color: "from-indigo-500 to-violet-500",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { ocrResult, loadHistory } = useOCRStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (ocrResult) {
      navigate("/editor");
    }
  }, [ocrResult, navigate]);

  return (
    <div className="min-h-screen pt-16">
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern bg-[size:60px_60px] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <section className="text-center mb-16 animate-stagger">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
            <span className="text-sm text-accent-primary font-medium">
              AI 智能识别 · 排版完美还原
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-text-primary via-accent-primary to-cyan-300 bg-clip-text text-transparent">
              让手写内容
            </span>
            <br />
            <span className="text-text-primary">瞬间数字化</span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            上传笔记、作业、手稿图片，AI 自动识别手写文字，
            保留原排版布局，支持在线编辑纠错，一键导出文档
          </p>
        </section>

        <section className="mb-16">
          <UploadArea />
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-10">
            核心功能特性
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="card group hover:-translate-y-1 hover:border-accent-primary/30 transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {f.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <HistoryList />
        </section>

        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-text-muted text-sm">
            OCR Studio · 基于 AI 技术的智能图像文字识别服务
          </p>
        </footer>
      </div>
    </div>
  );
}
