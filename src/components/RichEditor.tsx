import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import EditorToolbar from "./EditorToolbar.js";
import { useOCRStore } from "../store/ocrStore.js";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

export default function RichEditor() {
  const { editedContent, setEditedContent, ocrResult } = useOCRStore();

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        TextStyle,
        Color,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        FontFamily,
        FontSize,
        Placeholder.configure({
          placeholder: "识别内容将显示在这里，您可以自由编辑...",
        }),
      ],
      content: editedContent || "",
      onUpdate: ({ editor }) => {
        setEditedContent(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: "prose prose-invert max-w-none focus:outline-none min-h-full p-6",
        },
      },
    },
    [],
  );

  useEffect(() => {
    if (editor && editedContent && editor.getHTML() !== editedContent) {
      editor.commands.setContent(editedContent);
    }
  }, [editedContent, editor, ocrResult]);

  return (
    <div className="h-full flex flex-col bg-bg-secondary/20 rounded-2xl overflow-hidden border border-white/5">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto scrollbar-thin bg-white text-slate-900">
        <div className="min-h-full max-w-3xl mx-auto bg-white shadow-lg">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
