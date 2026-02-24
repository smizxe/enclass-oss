"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Image as ImageIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";  // Need to verify if textarea exists
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch"; // Need to check if switch exists
import { Label } from "@/components/ui/label";

interface PostEditorProps {
    classId?: string; // If undefined, Global
    onSuccess?: () => void;
}

export const PostEditor = ({ classId, onSuccess }: PostEditorProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPinned, setIsPinned] = useState(false);
    // Simplified image input for now (URL string)
    const [imageUrl, setImageUrl] = useState("");

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) return;

        setIsLoading(true);
        try {
            await axios.post("/api/community/posts", {
                title,
                content,
                classId: classId || undefined,
                pinned: isPinned,
                images: imageUrl ? [imageUrl] : []
            });

            toast.success("Đăng bài thành công!");
            setOpen(false);
            setTitle("");
            setContent("");
            setImageUrl("");
            setIsPinned(false);
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi đăng bài");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm cursor-pointer hover:border-indigo-300 transition group mb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-sm text-slate-500 group-hover:text-slate-600 transition border border-transparent group-hover:bg-slate-100">
                            Bạn muốn chia sẻ điều gì hôm nay?
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Tạo bài viết mới</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Tiêu đề</Label>
                        <Input
                            placeholder="Nhập tiêu đề bài viết..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Nội dung</Label>
                        <Textarea
                            placeholder="Nội dung chi tiết..."
                            className="min-h-[150px]"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Ảnh minh họa (URL)</Label>
                        <Input
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="pinned"
                            checked={isPinned}
                            onCheckedChange={setIsPinned}
                        />
                        <Label htmlFor="pinned">Ghim bài viết này lên đầu</Label>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !title || !content}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Đăng bài
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
