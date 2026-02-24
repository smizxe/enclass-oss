import prisma from "@/lib/prisma";
import Link from "next/link";
import { HomeNavbar } from "@/components/home-navbar";
import { HomeFooter } from "@/components/home-footer";
import { Calendar, User2, ArrowRight } from "lucide-react";

export const revalidate = 300; // ISR: cache 5 phút

export default async function BlogPage() {
    const posts = await prisma.post.findMany({
        where: { category: "BLOG", published: true },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <HomeNavbar />

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        Blog chính thức
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                        Bài viết & Chia sẻ
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Cập nhật những kiến thức, kinh nghiệm và thông tin mới nhất từ đội ngũ Thầy Điệp English.
                    </p>
                </div>

                {posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.id}`} className="group h-full">
                                <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group-hover:-translate-y-1">
                                    <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                        {(() => {
                                            // Robust banner display logic
                                            const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
                                            let showImage = false;

                                            if (post.bannerUrl) {
                                                if (post.bannerType === "IMAGE") showImage = true;
                                                else if (post.bannerType === "VIDEO" && isImage(post.bannerUrl)) showImage = true;
                                            }

                                            if (showImage && post.bannerUrl) {
                                                return (
                                                    <img
                                                        src={post.bannerUrl}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                );
                                            } else if (post.bannerType === "VIDEO" && post.bannerUrl) {
                                                // For list view, maybe just show video thumbnail or icon? 
                                                // Or iterate to find a thumbnail if youtube?
                                                // Simpler: Show Valid Video Placeholder
                                                return (
                                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-4xl">
                                                        📝
                                                    </div>
                                                );
                                            }
                                        })()}

                                        {post.pinned && (
                                            <div className="absolute top-3 left-3 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded shadow-lg uppercase tracking-wide">
                                                Ghim
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {post.title}
                                        </h2>
                                        <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">
                                            {post.excerpt || "Không có mô tả..."}
                                        </p>
                                        <span className="flex items-center gap-1 text-indigo-600 font-bold text-sm mt-auto group-hover:underline decoration-2 underline-offset-4">
                                            Đọc tiếp <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có bài viết nào</h3>
                        <p className="text-slate-500">Hãy quay lại sau nhé!</p>
                    </div>
                )}
            </main>

            <HomeFooter />
        </div>
    );
}
