import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeNavbar } from "@/components/home-navbar";
import { HomeFooter } from "@/components/home-footer";
import { Calendar, User2, ChevronLeft, Clock } from "lucide-react";

export const revalidate = 300; // ISR: cache 5 phút

interface BlogDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const { id } = await params;

    const post = await prisma.post.findFirst({
        where: {
            id,
            category: "BLOG",
            published: true,
        },
        include: {
            author: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!post) {
        notFound();
    }

    // Helper for YouTube embed
    const getYouTubeEmbedUrl = (url: string): string | null => {
        const match = url.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <HomeNavbar />

            <main className="pt-24 pb-20">
                {/* Header Section */}
                <div className="bg-slate-50 border-b border-slate-200 py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/blog" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Quay lại trang bài viết
                        </Link>

                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                            <span className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                {new Date(post.createdAt).toLocaleDateString("vi-VN", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            {/* Calculated read time placeholder if needed, or just author */}
                            <span className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                <User2 className="w-4 h-4 text-indigo-500" />
                                {post.author.name || "Admin"}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-8">
                            {post.title}
                        </h1>

                        {/* Banner */}
                        <div className="aspect-video w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
                            {(() => {
                                const showVideo = post.bannerType === "VIDEO" && post.bannerUrl && !isImage(post.bannerUrl);

                                if (showVideo) {
                                    const embedUrl = getYouTubeEmbedUrl(post.bannerUrl!);
                                    return embedUrl ? (
                                        <iframe
                                            src={embedUrl}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <video
                                            src={post.bannerUrl!}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    );
                                } else if (post.bannerUrl) {
                                    return (
                                        <img
                                            src={post.bannerUrl}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="w-full h-full bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-center">
                                            <span className="text-6xl">📝</span>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-3xl mx-auto px-6 py-12">
                    <article className="prose prose-lg prose-indigo max-w-none prose-headings:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-700 prose-img:rounded-xl prose-img:shadow-lg">
                        {post.content ? (
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />
                        ) : (
                            <p className="text-slate-500 italic">Bài viết chưa có nội dung chi tiết.</p>
                        )}
                    </article>

                    {/* Author Footer */}
                    <div className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                {post.author.name?.[0] || "A"}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg">{post.author.name || "Admin"}</h4>
                                <p className="text-slate-500 text-sm">Tác giả</p>
                            </div>
                        </div>

                        {/* Share buttons could go here */}
                    </div>
                </div>
            </main>

            <HomeFooter />
        </div>
    );
}
