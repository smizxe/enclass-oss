"use client";

import { useState } from "react";
import axios from "axios";
import useSWR from "swr";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BlogPost {
    id: string;
    title: string;
    excerpt: string | null;
    bannerUrl: string | null;
    bannerType: string | null;
    published: boolean;
    createdAt: string;
}

export default function BlogListPage() {
    const router = useRouter();

    const { data: posts = [], isLoading: loading, mutate } = useSWR<BlogPost[]>(
        "/api/teacher/blog"
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
        try {
            await axios.delete(`/api/teacher/blog/${id}`);
            toast.success("Đã xóa bài viết");
            mutate(posts.filter(p => p.id !== id), false);
        } catch {
            toast.error("Lỗi xóa bài viết");
        }
    };

    const togglePublish = async (id: string, published: boolean) => {
        try {
            await axios.patch(`/api/teacher/blog/${id}`, { published: !published });
            mutate(posts.map(p => p.id === id ? { ...p, published: !published } : p), false);
            toast.success(published ? "Đã ẩn bài viết" : "Đã xuất bản bài viết");
        } catch {
            toast.error("Lỗi cập nhật");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Blog</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Quản lý bài viết blog hiển thị trên trang chủ
                    </p>
                </div>
                <button
                    onClick={() => router.push("/teacher/blog/create")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Viết bài mới
                </button>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="text-4xl mb-3">✍️</div>
                    <p className="text-slate-500 font-medium">Chưa có bài viết nào</p>
                    <p className="text-slate-400 text-sm mt-1">Bắt đầu viết blog đầu tiên của bạn</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-5 hover:shadow-md transition-shadow"
                        >
                            {/* Banner thumbnail */}
                            {post.bannerUrl && post.bannerType === "IMAGE" ? (
                                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                    <img
                                        src={post.bannerUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">📝</span>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-900 truncate">{post.title}</h3>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${post.published
                                            ? "bg-green-100 text-green-700"
                                            : "bg-amber-100 text-amber-700"
                                            }`}
                                    >
                                        {post.published ? "Công khai" : "Nháp"}
                                    </span>
                                </div>
                                {post.excerpt && (
                                    <p className="text-sm text-slate-500 truncate">{post.excerpt}</p>
                                )}
                                <p className="text-xs text-slate-400 mt-1">
                                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => togglePublish(post.id, post.published)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title={post.published ? "Ẩn bài viết" : "Xuất bản"}
                                >
                                    {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => router.push(`/teacher/blog/${post.id}/edit`)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="Chỉnh sửa"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Xóa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
