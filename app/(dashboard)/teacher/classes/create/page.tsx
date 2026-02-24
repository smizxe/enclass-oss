"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";
import {
    ArrowLeft,
    BookOpen,
    Loader2
} from "lucide-react";

export default function CreateClassPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Vui lòng nhập tên lớp học");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post("/api/teacher/classes", {
                title,
                description
            });
            toast.success("Tạo lớp học thành công!");
            router.push(`/teacher/classes/${response.data.id}`);
        } catch {
            toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/teacher"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Tạo lớp học mới</h1>
                <p className="text-slate-500 mt-1">Bắt đầu bằng cách đặt tên và mô tả cho lớp học.</p>
            </div>

            {/* Form Card */}
            <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Thông tin cơ bản</h2>
                            <p className="text-xs text-slate-500">Bạn có thể chỉnh sửa sau</p>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tên lớp học <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ví dụ: Lớp IELTS Intensive K15"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Mô tả lớp học
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mô tả ngắn về nội dung và mục tiêu của lớp học..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm resize-none"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/25"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Tạo lớp học"
                                )}
                            </button>
                            <Link href="/teacher">
                                <button
                                    type="button"
                                    className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition"
                                >
                                    Hủy
                                </button>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
