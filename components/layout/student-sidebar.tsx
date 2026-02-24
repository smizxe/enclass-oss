"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    BookOpen,
    Clock,
    LogOut,
    GraduationCap,
    Trophy,
    User
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

// ... (imports)

const routes = [
    {
        label: "Trang chủ",
        icon: Home,
        href: "/student",
    },
    {
        label: "Lớp học",
        icon: BookOpen,
        href: "/student/classes",
    },
    {
        label: "Lịch sử làm bài",
        icon: Clock,
        href: "/student/history",
    },
    {
        label: "Bảng xếp hạng",
        icon: Trophy,
        href: "/student/leaderboard",
    },
];

export const StudentSidebar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
            {/* Logo - Light theme for student */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                    <span className="font-bold text-lg text-slate-900">DiepClass</span>
                    <div className="text-[10px] text-slate-500 font-medium">Học viên</div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-6">
                <nav className="space-y-1">
                    {routes.map((route) => {
                        const isActive = pathname === route.href ||
                            (route.href !== "/student" && pathname?.startsWith(route.href));

                        return (
                            <Link
                                key={`${route.href}-${route.label}`}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                <route.icon className={cn(
                                    "w-5 h-5",
                                    isActive ? "text-indigo-600" : "text-slate-400"
                                )} />
                                {route.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Progress Card */}
            <div className="px-3 mb-4">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white">
                    <div className="text-xs opacity-80 mb-1">Điểm dự đoán</div>
                    <div className="text-3xl font-bold">7.5</div>
                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-3">
                        <div className="w-3/4 bg-white h-1.5 rounded-full"></div>
                    </div>
                    <div className="text-[10px] opacity-80 mt-2">+0.5 so với tháng trước</div>
                </div>
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-slate-100">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                            {session?.user?.name || "Học viên"}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                            {session?.user?.email || "student@example.com"}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};
