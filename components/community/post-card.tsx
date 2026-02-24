"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { MoreVertical, Pin, Trash2, Edit2, MessageCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentList } from "./comment-list";

interface Post {
    id: string;
    title: string;
    content: string;
    images: string[];
    author: {
        name: string | null;
        image?: string;
    };
    createdAt: string;
    pinned: boolean;
}

interface PostCardProps {
    post: Post;
    isTeacher?: boolean;
    onDelete?: (id: string) => void;
    onEdit?: (post: Post) => void;
}

export const PostCard = ({ post, isTeacher, onDelete, onEdit }: PostCardProps) => {
    const [showComments, setShowComments] = useState(false);
    return (
        <div className={`bg-white rounded-xl border p-5 shadow-sm space-y-4 ${post.pinned ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'}`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={post.author.image} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                            {post.author.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{post.author.name}</h4>
                            {post.pinned && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                    <Pin className="w-3 h-3 fill-indigo-700" />
                                    Đã ghim
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            {format(new Date(post.createdAt), "HH:mm, dd 'thg' MM, yyyy", { locale: vi })}
                        </p>
                    </div>
                </div>

                {isTeacher && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(post)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete?.(post.id)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa bài viết
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Content */}
            <div className="space-y-3">
                <h3 className="font-semibold text-lg text-slate-800">{post.title}</h3>
                <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">
                    {post.content}
                </div>

                {/* Images Grid */}
                {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 mt-3 ${post.images.length === 1 ? 'grid-cols-1' :
                        post.images.length === 2 ? 'grid-cols-2' :
                            'grid-cols-2 md:grid-cols-3'
                        }`}>
                        {post.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-100 bg-slate-50 group">
                                <img
                                    src={img}
                                    alt={`Image ${idx + 1}`}
                                    className="w-full h-full object-cover transition group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-4">
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 text-sm transition ${showComments ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                    <MessageCircle className="w-4 h-4" />
                    Bình luận
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                    <CommentList postId={post.id} />
                </div>
            )}
        </div>
    );
}
