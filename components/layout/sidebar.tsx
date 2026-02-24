"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    LogOut,
    GraduationCap,
    Settings,
    ClipboardCheck,
    Globe,
    PenSquare
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const routes = [
    {
        label: "Tổng quan",
        icon: LayoutDashboard,
        href: "/teacher",
    },
    {
        label: "Lớp học",
        icon: BookOpen,
        href: "/teacher/classes",
    },
    {
        label: "Học viên",
        icon: Users,
        href: "/teacher/students",
    },
    {
        label: "Cộng đồng",
        icon: Globe,
        href: "/community",
    },
    {
        label: "Blog",
        icon: PenSquare,
        href: "/teacher/blog",
    },
    {
        label: "Chấm điểm",
        icon: ClipboardCheck,
        href: "/teacher/grading",
    },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();

    const userName = session?.user?.name || "Thầy Điệp";
    const userEmail = session?.user?.email || "teacher@example.com";
    const userInitials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                    <span className="font-bold text-lg">DiepClass</span>
                    <div className="text-[10px] text-slate-400 font-medium">Teacher Portal</div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-6">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-3">
                    Menu chính
                </div>
                <nav className="space-y-1">
                    {routes.map((route) => {
                        const isActive = pathname === route.href ||
                            (route.href !== "/teacher" && pathname?.startsWith(route.href));

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <route.icon className="w-5 h-5" />
                                {route.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-3 mt-8 mb-3">
                    Hệ thống
                </div>
                <nav className="space-y-1">
                    <Link
                        href="/teacher/settings"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                            pathname === "/teacher/settings"
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Settings className="w-5 h-5" />
                        Cài đặt
                    </Link>
                </nav>
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-slate-800">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                        {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{userName}</div>
                        <div className="text-xs text-slate-400 truncate">{userEmail}</div>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};
