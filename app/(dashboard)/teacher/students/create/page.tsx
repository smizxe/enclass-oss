"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";
import {
    ArrowLeft,
    UserPlus,
    Loader2
} from "lucide-react";

export default function CreateStudentPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !password.trim()) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/teacher/students", {
                name,
                email,
                password
            });
            toast.success("Tạo tài khoản học viên thành công!");
            router.push("/teacher/students");
            router.refresh();
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error("Email đã được sử dụng");
            } else {
                toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/teacher/students"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Thêm học viên mới</h1>
                <p className="text-slate-500 mt-1">Tạo tài khoản cho học viên mới để họ có thể đăng nhập.</p>
            </div>

            {/* Form Card */}
            <div className="max-w-xl">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Thông tin tài khoản</h2>
                            <p className="text-xs text-slate-500">Thông tin đăng nhập của học viên</p>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nguyễn Văn A"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="student@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-slate-500 mt-2">Mật khẩu phải có ít nhất 6 ký tự.</p>
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
                                    "Tạo tài khoản"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
