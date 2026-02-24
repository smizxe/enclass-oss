"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Eye, ImageIcon, Video, Loader2 } from "lucide-react";
import { TipTapEditor } from "@/components/editor/tiptap-editor";

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const blogId = params.id as string;

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [excerpt, setExcerpt] = useState("");

    // Banner states
    const [bannerType, setBannerType] = useState<"IMAGE" | "VIDEO">("IMAGE");
    const [bannerImageUrl, setBannerImageUrl] = useState("");
    const [bannerVideoUrl, setBannerVideoUrl] = useState("");

    const [published, setPublished] = useState(false);
    const [pinned, setPinned] = useState(false);

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const { data } = await axios.get(`/api/teacher/blog/${blogId}`);
                setTitle(data.title);
                setContent(data.content);
                setExcerpt(data.excerpt || "");

                // Initialize banner states
                setBannerType(data.bannerType || "IMAGE");
                if (data.bannerType === "VIDEO") {
                    setBannerVideoUrl(data.bannerUrl || "");
                } else {
                    setBannerImageUrl(data.bannerUrl || "");
                }

                setPublished(data.published);
                setPinned(data.pinned || false);
            } catch {
                toast.error("Không tìm thấy bài viết");
                router.push("/teacher/blog");
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [blogId, router]);

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingBanner(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const { data } = await axios.post("/api/upload/images", formData);
            if (data.url) {
                setBannerImageUrl(data.url);
                setBannerType("IMAGE");
                toast.success("Banner uploaded!");
            }
        } catch {
            toast.error("Lỗi upload banner");
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Vui lòng nhập tiêu đề");
            return;
        }

        // Determine final banner URL
        const finalBannerUrl = bannerType === "IMAGE" ? bannerImageUrl : bannerVideoUrl;

        setSaving(true);
        try {
            await axios.patch(`/api/teacher/blog/${blogId}`, {
                title,
                content,
                excerpt,
                bannerUrl: finalBannerUrl || null,
                bannerType: finalBannerUrl ? bannerType : null,
                published,
                pinned,
            });
            toast.success("Đã lưu thay đổi!");
            router.push("/teacher/blog");
            router.refresh();
        } catch {
            toast.error("Lỗi lưu bài viết");
        } finally {
            setSaving(false);
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
        <div className="max-w-4xl mx-auto p-6">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.push("/teacher/blog")}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </button>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer mr-2">
                        <input
                            type="checkbox"
                            checked={pinned}
                            onChange={(e) => setPinned(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-600 font-medium">Ghim lên trang chủ</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Xuất bản</span>
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>

            {/* Title */}
            <input
                type="text"
                placeholder="Tiêu đề bài viết..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-bold text-slate-900 placeholder-slate-300 border-none outline-none mb-4 bg-transparent"
            />

            {/* Excerpt */}
            <textarea
                placeholder="Tóm tắt ngắn (hiển thị trên trang chủ)..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="w-full text-sm text-slate-600 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-3 mb-4 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />

            {/* Banner */}
            <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                    Banner (ảnh hoặc video)
                </label>
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={() => setBannerType("IMAGE")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bannerType === "IMAGE"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Ảnh
                    </button>
                    <button
                        onClick={() => setBannerType("VIDEO")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bannerType === "VIDEO"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                    >
                        <Video className="w-3.5 h-3.5" />
                        Video
                    </button>
                </div>

                {bannerType === "IMAGE" ? (
                    <div className="space-y-2">
                        {bannerImageUrl && (
                            <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100">
                                <img src={bannerImageUrl} alt="Banner" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setBannerImageUrl("")}
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-lg px-2 py-1 text-xs hover:bg-black/70"
                                >
                                    Xóa
                                </button>
                            </div>
                        )}
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-4 cursor-pointer hover:border-indigo-400 transition-colors">
                            {uploadingBanner ? (
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-500">Upload ảnh banner</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleBannerUpload}
                            />
                        </label>
                    </div>
                ) : (
                    <input
                        type="url"
                        placeholder="Dán link video YouTube hoặc link trực tiếp..."
                        value={bannerVideoUrl}
                        onChange={(e) => setBannerVideoUrl(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                )}
            </div>

            {/* Editor */}
            <TipTapEditor content={content} onChange={setContent} />
        </div>
    );
}
