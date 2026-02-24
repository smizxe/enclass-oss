"use client";

import Link from "next/link";
import { GraduationCap, User } from "lucide-react";
import { useSession } from "next-auth/react";

export const HomeNavbar = () => {
    const { data: session, status } = useSession();

    return (
        <nav className="fixed w-full top-0 z-50 glass-nav transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">
                        Diep<span className="text-indigo-600">Class</span>
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
                    <a href="#benefits" className="hover:text-indigo-600 transition-colors">Lợi ích</a>
                    <a href="#system" className="hover:text-indigo-600 transition-colors">Hệ thống</a>
                    <a href="#results" className="hover:text-indigo-600 transition-colors">Thành tích HV</a>
                </div>

                <div className="flex items-center gap-4">
                    {status === "authenticated" ? (
                        <Link
                            href={session?.user?.role === "TEACHER" ? "/teacher" : "/student"}
                            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                        >
                            <GraduationCap className="w-4 h-4" />
                            {session?.user?.role === "TEACHER" ? "Khu vực Giáo viên" : "Vào Học"}
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                                <User className="w-4 h-4" />
                                Học viên đăng nhập
                            </Link>
                            <a href="#register" className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                                Đăng ký học
                            </a>
                        </>
                    )}
                    {status === "loading" && (
                        <div className="w-24 h-9 bg-slate-100 rounded-lg animate-pulse"></div>
                    )}
                </div>
            </div>
        </nav>
    );
};
