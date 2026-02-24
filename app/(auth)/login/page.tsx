"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false
        });

        setIsLoading(false);

        if (result?.error) {
            toast.error("Email hoặc mật khẩu không đúng.");
        } else {
            toast.success("Đăng nhập thành công!");

            // Use getSession for better reliability
            const session = await getSession();

            // Hard redirect to ensure fresh state
            if (session?.user?.role === "TEACHER") {
                window.location.href = "/teacher";
            } else if (session?.user?.role === "STUDENT") {
                window.location.href = "/student";
            } else {
                // Fallback catch-all
                window.location.href = "/student";
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-7 h-7" />
                        </div>
                        <span className="text-2xl font-bold">DiepClass</span>
                    </div>

                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Chào mừng trở lại!
                    </h1>
                    <p className="text-indigo-100 text-lg leading-relaxed max-w-md">
                        Đăng nhập để tiếp tục hành trình chinh phục IELTS/TOEIC cùng thầy Điệp.
                    </p>

                    <div className="mt-12 p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                                🎯
                            </div>
                            <div>
                                <div className="font-semibold">Mục tiêu tuần này</div>
                                <div className="text-sm text-indigo-200">Hoàn thành 5 bài tập Reading</div>
                            </div>
                        </div>
                        <div className="w-full bg-white/20 h-2 rounded-full">
                            <div className="w-3/5 bg-white h-2 rounded-full"></div>
                        </div>
                        <div className="text-xs text-indigo-200 mt-2">3/5 bài đã hoàn thành</div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">DiepClass</span>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập</h2>
                        <p className="text-slate-500">Nhập thông tin tài khoản của bạn</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-slate-600">Ghi nhớ đăng nhập</span>
                            </label>
                            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Đăng nhập
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        Chưa có tài khoản?{" "}
                        <Link href="/#register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Đăng ký học ngay
                        </Link>
                    </div>

                    {/* Demo accounts hint */}
                    <div className="mt-8 p-4 bg-slate-100 rounded-xl text-xs text-slate-600">
                        <div className="font-semibold mb-2">🔑 Tài khoản Demo:</div>
                        <div className="space-y-1">
                            <div><span className="font-medium">Giáo viên:</span> teacher@example.com / teacher123</div>
                            <div><span className="font-medium">Học sinh:</span> student@example.com / student123</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
