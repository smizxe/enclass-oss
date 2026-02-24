"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, Lock, Loader2, KeyRound } from "lucide-react";
import axios from "axios";

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        setIsLoading(true);

        try {
            await axios.patch("/api/teacher/settings/password", {
                currentPassword,
                newPassword,
            });

            toast.success("Đổi mật khẩu thành công!");
            // Reset form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            router.refresh();
        } catch (error: any) {
            if (error.response?.data) {
                toast.error(error.response.data);
            } else {
                toast.error("Đã xảy ra lỗi khi đổi mật khẩu");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cài đặt hệ thống</h1>
                    <p className="text-slate-500 mt-1">Quản lý tài khoản và tuỳ chọn cá nhân</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left column - Navigation/Tabs if needed in future */}
                <div className="col-span-1 space-y-2">
                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium transition text-sm">
                        <div className="flex items-center gap-3">
                            <KeyRound className="w-4 h-4" />
                            Mật khẩu & Bảo mật
                        </div>
                    </button>
                    {/* Placeholder for future settings tabs */}
                </div>

                {/* Right column - Content */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-slate-500" />
                                Đổi mật khẩu
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Đảm bảo tài khoản của bạn đang sử dụng mật khẩu an toàn dài ít nhất 6 ký tự.</p>
                        </div>

                        <form onSubmit={onSubmit} className="p-6 space-y-6">
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Mật khẩu hiện tại
                                    </label>
                                    <input
                                        type="password"
                                        disabled={isLoading}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        disabled={isLoading}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        disabled={isLoading}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end border-t border-slate-100 pt-6">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
