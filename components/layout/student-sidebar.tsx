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
    User,
    Users,
    Sparkles,
    Star
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
        label: "Cộng đồng",
        icon: Users,
        href: "/community",
        isExternal: true
    },
];

interface StudentSidebarProps {
    progressCount?: number;
    totalCount?: number;
}

export const StudentSidebar = ({
    progressCount = 0,
    totalCount = 0
}: StudentSidebarProps) => {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-indigo-950 via-[#1e1b4b] to-indigo-950 border-r border-indigo-800/30 shadow-2xl relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-40 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Logo */}
            <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5 backdrop-blur-md relative z-10">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
                    <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                    <span className="font-bold text-lg text-white tracking-tight">DiepClass</span>
                    <div className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        Học viên
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6 relative z-10 overflow-y-auto custom-scrollbar-dark">
                <nav className="space-y-2">
                    {routes.map((route) => {
                        const isActive = pathname === route.href ||
                            (route.href !== "/student" && pathname?.startsWith(route.href));

                        return (
                            <Link
                                key={`${route.href}-${route.label}`}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                                    isActive
                                        ? "bg-white text-indigo-700 shadow-[0_4px_20px_-5px_rgba(255,255,255,0.3)] scale-[1.02] font-semibold"
                                        : "text-indigo-100 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isActive ? "bg-indigo-100 text-indigo-600" : "bg-white/5 text-indigo-300 group-hover:text-white group-hover:bg-white/10"
                                )}>
                                    <route.icon className="w-5 h-5" />
                                </div>
                                {route.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Progress Card */}
                <div className="mt-8 mx-1">
                    <div className="relative overflow-hidden rounded-2xl p-0.5 bg-gradient-to-br from-indigo-400 via-purple-400 to-amber-300 shadow-xl">
                        <div className="bg-[#1e1b4b]/95 backdrop-blur-xl rounded-[14px] p-4 relative h-full">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Star className="w-12 h-12 text-amber-400 fill-amber-400 rotate-12" />
                            </div>

                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <div className="p-1.5 bg-amber-400/20 rounded-lg">
                                    <Trophy className="w-4 h-4 text-amber-300" />
                                </div>
                                <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Tiến độ học tập</span>
                            </div>

                            <div className="flex items-end gap-2 mb-1 relative z-10">
                                <span className="text-3xl font-bold text-white tracking-tight">
                                    {totalCount > 0 ? Math.round((progressCount / totalCount) * 100) : 0}%
                                </span>
                                <span className="text-sm text-indigo-300 mb-1.5 font-medium">hoàn thành</span>
                            </div>

                            <div className="w-full bg-indigo-950/50 h-2 rounded-full mt-2 border border-white/5 relative z-10">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_10px_rgba(252,211,77,0.5)] transition-all duration-500"
                                    style={{ width: `${totalCount > 0 ? (progressCount / totalCount) * 100 : 0}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center mt-3 text-[10px] text-indigo-300 font-medium relative z-10">
                                <span>{progressCount}/{totalCount} bài tập</span>
                                <span className="text-amber-300">Cố lên!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Section */}
            <div className="p-4 border-t border-white/5 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-3 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-indigo-900">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
                            {session?.user?.name || "Học viên"}
                        </div>
                        <div className="text-xs text-indigo-300/80 truncate">
                            {session?.user?.email || "student@example.com"}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-200 hover:text-white hover:bg-red-500/80 hover:shadow-lg hover:shadow-red-900/20 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                </button>
            </div>

            {/* Injected Styles */}
            <style jsx global>{`
                .custom-scrollbar-dark::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};
