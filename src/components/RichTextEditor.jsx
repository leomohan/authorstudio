import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Save,
  Underline as UnderlineIcon,
} from "lucide-react";

const ToolbarButton = ({ onClick, active, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
      active
        ? "border-accent bg-accent text-white"
        : "border-line bg-white text-muted hover:border-accent hover:text-accent"
    }`}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
);

export function RichTextEditor({
  value,
  onChange,
  onSave,
  onInsertImage,
  placeholder,
}) {
  const fileInputRef = useRef(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Superscript,
      Subscript,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none min-h-[28rem] rounded-3xl border border-line bg-white px-6 py-8 font-serif text-[1.05rem] leading-8 text-ink outline-none focus:border-accent",
      },
    },
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getHTML()),
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-panel p-3 shadow-panel">
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Block quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Superscript"
          active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          x<sup>2</sup>
        </ToolbarButton>
        <ToolbarButton
          label="Subscript"
          active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          x<sub>2</sub>
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus size={16} />
        </ToolbarButton>
        <ToolbarButton label="Save" onClick={onSave}>
          <Save size={16} />
        </ToolbarButton>
      </div>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={async (event) => {
          const [file] = event.target.files || [];
          if (!file) return;
          const image = await onInsertImage(file);
          if (image) {
            editor
              .chain()
              .focus()
              .setImage({
                src: image.dataUrl,
                alt: image.name,
                "data-image-id": image.id,
              })
              .run();
          }
          event.target.value = "";
        }}
      />

      <div className="text-sm text-muted">{placeholder}</div>
      <EditorContent editor={editor} />
    </div>
  );
}
