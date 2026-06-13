import { useEditor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Type,
  Palette,
  Minus,
} from "lucide-react";

interface Props {
  editor: ReturnType<typeof useEditor> | null;
}

const FONT_FAMILIES = [
  { label: "思源黑体", value: "Noto Sans SC" },
  { label: "系统默认", value: "system-ui" },
  { label: "等宽字体", value: "JetBrains Mono" },
  { label: "衬线字体", value: "Georgia" },
];

const FONT_SIZES = [
  { label: "小", value: "14px" },
  { label: "正常", value: "16px" },
  { label: "大", value: "18px" },
  { label: "特大", value: "24px" },
  { label: "标题", value: "32px" },
];

const COLORS = [
  "#F8FAFC",
  "#94A3B8",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#8B5CF6",
  "#EF4444",
  "#EC4899",
];

function ToolButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all duration-150 ${
        isActive
          ? "bg-accent-primary/20 text-accent-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-white/5"
      } disabled:opacity-30 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-white/10 mx-1" />;
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const handleFontFamily = (e: React.ChangeEvent<HTMLSelectElement>) => {
    editor.chain().focus().setFontFamily(e.target.value).run();
  };

  const handleFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    editor.chain().focus().setFontSize(e.target.value).run();
  };

  const handleColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/5 bg-bg-primary/30">
      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="撤销"
      >
        <Undo className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="重做"
      >
        <Redo className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <div className="relative group">
        <ToolButton onClick={() => {}} title="标题">
          <Type className="w-4 h-4" />
        </ToolButton>
        <div className="absolute top-full left-0 mt-1 p-1 card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col min-w-[120px]">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="px-3 py-1.5 text-left rounded-lg hover:bg-white/5 text-text-primary text-lg font-bold"
          >
            标题 1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="px-3 py-1.5 text-left rounded-lg hover:bg-white/5 text-text-primary text-base font-semibold"
          >
            标题 2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className="px-3 py-1.5 text-left rounded-lg hover:bg-white/5 text-text-primary text-sm font-medium"
          >
            标题 3
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className="px-3 py-1.5 text-left rounded-lg hover:bg-white/5 text-text-secondary text-sm"
          >
            正文
          </button>
        </div>
      </div>

      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="标题1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="标题2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="粗体"
      >
        <Bold className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="斜体"
      >
        <Italic className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="下划线"
      >
        <Underline className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="删除线"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <div className="relative group">
        <ToolButton onClick={() => {}} title="颜色">
          <Palette className="w-4 h-4" />
        </ToolButton>
        <div className="absolute top-full left-0 mt-1 p-2 card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
          <div className="grid grid-cols-4 gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColor(color)}
                className="w-6 h-6 rounded-lg border border-white/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <Divider />

      <select
        onChange={handleFontFamily}
        className="h-8 px-2 rounded-lg bg-bg-tertiary/50 border border-white/10 text-text-primary text-sm focus:outline-none focus:border-accent-primary/50 cursor-pointer"
        title="字体"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        onChange={handleFontSize}
        className="h-8 px-2 rounded-lg bg-bg-tertiary/50 border border-white/10 text-text-primary text-sm focus:outline-none focus:border-accent-primary/50 cursor-pointer"
        title="字号"
      >
        {FONT_SIZES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="左对齐"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="居中"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="右对齐"
      >
        <AlignRight className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="无序列表"
      >
        <List className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="有序列表"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="引用"
      >
        <Quote className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="代码块"
      >
        <Code className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="分隔线/分页"
      >
        <Minus className="w-4 h-4" />
      </ToolButton>
    </div>
  );
}
