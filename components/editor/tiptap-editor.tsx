"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    ImageIcon,
    Link as LinkIcon,
    Undo,
    Redo,
    Quote,
    Code,
} from "lucide-react";
import { useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface TipTapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export const TipTapEditor = ({ content, onChange, placeholder }: TipTapEditorProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Image.configure({ inline: false, allowBase64: false }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-indigo-600 underline" } }),
            Underline,
            Placeholder.configure({ placeholder: placeholder || "Viết nội dung bài blog..." }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-slate max-w-none min-h-[300px] focus:outline-none px-4 py-3",
            },
        },
        immediatelyRender: false,
    });

    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const { data } = await axios.post("/api/upload/images", formData);
            if (data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
            }
        } catch {
            toast.error("Lỗi upload ảnh");
        }
    }, [editor]);

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const addLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL:", previousUrl);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    const ToolbarButton = ({
        onClick,
        isActive,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-lg transition-colors ${isActive
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 flex-wrap">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive("underline")}
                    title="Underline"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive("codeBlock")}
                    title="Code Block"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarButton onClick={triggerImageUpload} title="Upload Image">
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title="Add Link">
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />

            {/* Hidden file input for image upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        await handleImageUpload(file);
                        e.target.value = "";
                    }
                }}
            />
        </div>
    );
};
