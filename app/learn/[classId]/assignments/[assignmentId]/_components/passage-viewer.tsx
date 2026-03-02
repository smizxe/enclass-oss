"use client";

import { useState } from "react";
import { BookOpen, Image as ImageIcon, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";

interface PassageViewerProps {
    sectionTitle: string;
    passage?: string;
    passageTranslation?: string;
    sectionImages?: string[];
    sectionVideo?: string;
    fontSize?: number;
}

/** Strip duplicate (N) markers next to {N} — legacy data cleanup */
function cleanPassageMarkers(text: string): string {
    // "(19) {19}" or "(19){19}" → "{19}"
    let cleaned = text.replace(/\((\d+)\)\s*\{(\1)\}/g, '{$2}');
    // "19. {19}" → "{19}"
    cleaned = cleaned.replace(/(\d+)\.\s*\{(\1)\}/g, '{$2}');
    return cleaned;
}

export const PassageViewer = ({
    sectionTitle,
    passage,
    passageTranslation,
    sectionImages = [],
    sectionVideo,
    fontSize = 16
}: PassageViewerProps) => {
    const hasPassage = !!passage;
    const hasImages = sectionImages.length > 0;
    const hasVideo = !!sectionVideo;

    // Default Tab Logic
    const [activeTab, setActiveTab] = useState<"PASSAGE" | "IMAGES" | "VIDEO">(() => {
        if (hasPassage) return "PASSAGE";
        if (hasVideo) return "VIDEO";
        if (hasImages) return "IMAGES";
        return "PASSAGE";
    });

    // Lightbox State
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // YouTube Embed Helper
    const getYouTubeEmbedUrl = (url: string) => {
        try {
            let videoId = "";
            if (url.includes("youtube.com/watch?v=")) {
                videoId = url.split("v=")[1].split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1].split("?")[0];
            } else if (url.length === 11) {
                videoId = url; // Assume it IS the ID
            }

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        } catch { }
        return "";
    };

    if (!hasPassage && !hasImages && !hasVideo) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 italic">
                <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Phần này không có nội dung học liệu</p>
                </div>
            </div>
        );
    }

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const nextImage = () => setLightboxIndex(prev => (prev !== null && prev < sectionImages.length - 1 ? prev + 1 : prev));
    const prevImage = () => setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));

    return (
        <div className="h-full flex flex-col">
            {/* Header / Tabs */}
            <div className="shrink-0 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span>{sectionTitle}</span>
                    </div>
                </div>

                {/* Tabs - Show if more than 1 type exists OR force show if only 1 but we want consistent UI? 
                    Actually, if only 1 type exists, we can hide tabs to save space, OR show for clarity.
                    Let's show if total types > 1.
                */}
                {((hasPassage ? 1 : 0) + (hasImages ? 1 : 0) + (hasVideo ? 1 : 0)) > 1 && (
                    <div className="flex p-1 bg-slate-100 rounded-lg w-fit overflow-x-auto max-w-full">
                        {hasPassage && (
                            <button
                                onClick={() => setActiveTab("PASSAGE")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${activeTab === "PASSAGE"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                Bài đọc
                            </button>
                        )}
                        {hasVideo && (
                            <button
                                onClick={() => setActiveTab("VIDEO")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${activeTab === "VIDEO"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                Video
                            </button>
                        )}
                        {hasImages && (
                            <button
                                onClick={() => setActiveTab("IMAGES")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${activeTab === "IMAGES"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <ImageIcon className="w-4 h-4" />
                                Hình ảnh ({sectionImages.length})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">

                {/* 1. PASSAGE VIEW */}
                {activeTab === "PASSAGE" && hasPassage && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-3 border-b border-slate-100 pb-2">
                            <BookOpen className="w-4 h-4" />
                            <span>Đọc đoạn văn</span>
                        </div>

                        <div
                            className="text-slate-700 leading-relaxed prose prose-sm max-w-none break-words min-w-0 [&_strong]:font-bold [&_em]:italic [&_p]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {cleanPassageMarkers(passage || "")}
                            </ReactMarkdown>
                        </div>

                        {passageTranslation && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-2">📖 Tạm dịch:</div>
                                <div
                                    className="text-slate-600 italic leading-relaxed break-words min-w-0"
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {passageTranslation}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. VIDEO VIEW */}
                {activeTab === "VIDEO" && hasVideo && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-in fade-in duration-300">
                        {/* We can parse standard YouTube links */}
                        {(() => {
                            const embedUrl = getYouTubeEmbedUrl(sectionVideo);
                            if (embedUrl) {
                                return (
                                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                                        <iframe
                                            src={embedUrl}
                                            className="w-full h-full"
                                            title="Video Bài Giảng"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                        Không thể tải video. Vui lòng kiểm tra lại đường dẫn.
                                        <br />
                                        <a href={sectionVideo} target="_blank" rel="noopener noreferrer" className="underline mt-1 block">
                                            Mở link gốc
                                        </a>
                                    </div>
                                );
                            }
                        })()}

                        <div className="mt-4 text-xs text-slate-400 text-center">
                            Nguồn: {sectionVideo}
                        </div>
                    </div>
                )}

                {/* 3. IMAGES VIEW */}
                {activeTab === "IMAGES" && hasImages && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-in fade-in duration-300">
                        <div className="flex flex-col gap-6">
                            {sectionImages.map((src, idx) => (
                                <div
                                    key={idx}
                                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt={`Image ${idx + 1}`}
                                        className="w-full h-auto object-contain cursor-zoom-in"
                                        onClick={() => openLightbox(idx)}
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => openLightbox(idx)}
                                            className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm shadow-sm"
                                            title="Phóng to"
                                        >
                                            <ZoomIn className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* LIGHTBOX MODAL */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-[101]"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        disabled={lightboxIndex === 0}
                        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition disabled:opacity-30 disabled:cursor-not-allowed z-[101]"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={sectionImages[lightboxIndex]}
                            alt="Full view"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="text-center text-white/70 mt-4 text-sm font-medium">
                            {lightboxIndex + 1} / {sectionImages.length}
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        disabled={lightboxIndex === sectionImages.length - 1}
                        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition disabled:opacity-30 disabled:cursor-not-allowed z-[101]"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    {/* Click backdrop to close */}
                    <div className="absolute inset-0 -z-10" onClick={closeLightbox} />
                </div>
            )}
        </div>
    );
};
