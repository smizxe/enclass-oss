"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, User2 } from "lucide-react";

interface BlogPost {
    id: string;
    title: string;
    excerpt: string | null;
    bannerUrl: string | null;
    bannerType: string | null;
    createdAt: string;
    author: { name: string | null };
}

// Helper to convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function HeroBlogSection() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch("/api/blog")
            .then((r) => r.json())
            .then((data) => {
                setPosts(data);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    const mainPost = posts[0];
    const sidePosts = posts.slice(1, 3);

    if (!loaded) {
        return (
            <div className="relative max-w-5xl mx-auto">
                <div className="h-[400px] bg-slate-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    // If no blog posts exist, show a minimal intro video placeholder
    if (posts.length === 0) {
        return (
            <div className="relative max-w-5xl mx-auto">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-12 text-center border border-indigo-100">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Cập nhật bài viết từ Thầy Điệp
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Các bài viết chia sẻ kinh nghiệm học tập, tips luyện thi và thông tin lớp học sẽ xuất hiện tại đây.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl opacity-10 blur-xl" />

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Main Post (Large) */}
                {mainPost && (
                    <div className="md:col-span-2 group">
                        <Link href={`/blog/${mainPost.id}`} className="block h-full">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-2xl transition-shadow">
                                {/* Banner */}
                                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                    {(() => {
                                        const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
                                        const showVideo = mainPost.bannerType === "VIDEO" && mainPost.bannerUrl && !isImage(mainPost.bannerUrl);

                                        if (showVideo) {
                                            const embedUrl = getYouTubeEmbedUrl(mainPost.bannerUrl!);
                                            // Prevent link click for video interaction? 
                                            // Actually, iframe captures clicks. 
                                            // If video, maybe separate link button?
                                            // For now, let's just render it. If user clicks outside iframe, it navigates.
                                            return embedUrl ? (
                                                <div className="w-full h-full relative z-10" onClick={(e) => e.stopPropagation()}>
                                                    <iframe
                                                        src={embedUrl}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ) : (
                                                <video
                                                    src={mainPost.bannerUrl!}
                                                    className="w-full h-full object-cover"
                                                    controls
                                                    preload="metadata"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            );
                                        } else if (mainPost.bannerUrl) {
                                            return (
                                                <img
                                                    src={mainPost.bannerUrl}
                                                    alt={mainPost.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            );
                                        } else {
                                            return (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center">
                                                    <span className="text-6xl">📝</span>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                                        <span className="flex items-center gap-1">
                                            <User2 className="w-3 h-3" />
                                            {mainPost.author?.name || "Thầy Điệp"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(mainPost.createdAt).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {mainPost.title}
                                    </h3>
                                    {mainPost.excerpt && (
                                        <p className="text-sm text-slate-500 line-clamp-2 flex-1">
                                            {mainPost.excerpt}
                                        </p>
                                    )}
                                    <div className="mt-4">
                                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
                                            Đọc thêm
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Side Posts (Small) */}
                <div className="flex flex-col gap-5">
                    {sidePosts.map((post) => (
                        <Link key={post.id} href={`/blog/${post.id}`} className="group">
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow">
                                {post.bannerUrl && post.bannerType === "IMAGE" ? (
                                    <div className="h-32 bg-slate-100 overflow-hidden">
                                        <img
                                            src={post.bannerUrl}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                                        <span className="text-3xl">📄</span>
                                    </div>
                                )}
                                <div className="p-4 flex-1 flex flex-col">
                                    <span className="text-[10px] text-slate-400 mb-1.5">
                                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {post.title}
                                    </h4>
                                    {post.excerpt && (
                                        <p className="text-xs text-slate-500 line-clamp-2 flex-1">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 mt-2">
                                        Đọc thêm
                                        <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {/* Fill empty slots */}
                    {sidePosts.length === 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 text-center border border-slate-100 flex-1 flex items-center justify-center">
                            <p className="text-xs text-slate-400">Thêm bài viết blog để hiển thị</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
