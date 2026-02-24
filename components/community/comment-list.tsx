"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Send, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        image?: string;
    };
}

interface CommentListProps {
    postId: string;
}

export const CommentList = ({ postId }: CommentListProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await axios.get(`/api/community/posts/${postId}/comments`);
            setComments(res.data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/api/community/posts/${postId}/comments`, {
                content: newComment
            });
            setNewComment("");
            fetchComments(); // Refresh list
        } catch (error) {
            toast.error("Không thể gửi bình luận");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="pt-4 border-t border-slate-100 space-y-4">
            {/* Comment List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-2">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <Avatar className="w-8 h-8 border border-slate-100">
                                <AvatarImage src={comment.author.image} />
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-500">
                                    {comment.author.name?.[0]?.toUpperCase() || <UserIcon className="w-3 h-3" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="bg-slate-50 rounded-2xl px-3 py-2 text-sm">
                                    <span className="font-semibold text-slate-900 mr-2">{comment.author.name}</span>
                                    <span className="text-slate-700">{comment.content}</span>
                                </div>
                                <div className="px-2 text-[10px] text-slate-400">
                                    {format(new Date(comment.createdAt), "HH:mm, dd 'thg' MM", { locale: vi })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-full h-10 px-4"
                    disabled={isSubmitting}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newComment.trim() || isSubmitting}
                    className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 shrink-0"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </form>
        </div>
    );
};
