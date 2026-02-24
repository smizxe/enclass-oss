"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    BookOpen,
    Loader2,
    Clock,
    Trophy,
    CheckCircle2,
    ArrowRight,
    FileText,
    Mic,
    PenTool,
    Sparkles,
    BarChart3,
    GraduationCap,
    History
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface DashboardData {
    stats: {
        totalCompleted: number;
        averageScore: string | null;
        totalClasses: number;
        pendingCount: number;
    };
    pendingAssignments: Array<{
        id: string;
        title: string;
        type: string;
        classId: string;
        className: string;
        createdAt: string;
    }>;
    recentActivity: Array<{
        id: string;
        assignmentId: string;
        assignmentTitle: string;
        assignmentType: string;
        classId: string;
        className: string;
        score: number | null;
        submittedAt: string;
    }>;
}

const assignmentTypeIcons: Record<string, React.ReactNode> = {
    QUIZ: <FileText className="w-4 h-4" />,
    ESSAY: <PenTool className="w-4 h-4" />,
    SPEAKING: <Mic className="w-4 h-4" />,
    LISTENING: <BookOpen className="w-4 h-4" />,
    READING: <BookOpen className="w-4 h-4" />,
    MIXED: <Sparkles className="w-4 h-4" />
};

const assignmentTypeLabels: Record<string, string> = {
    QUIZ: "Trắc nghiệm",
    ESSAY: "Viết",
    SPEAKING: "Nói",
    LISTENING: "Nghe",
    READING: "Đọc",
    MIXED: "Tổng hợp"
};

export default function StudentDashboard() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/student/dashboard")
            .then((res) => {
                if (res.ok) return res.json();
                return null;
            })
            .then((result) => {
                setData(result);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center text-slate-500">
                Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
        );
    }

    const greeting = getGreeting();

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-full">
            {/* Header with Greeting */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {greeting}, {session?.user?.name || "bạn"}! 👋
                        </h1>
                        <p className="text-slate-500">Tiếp tục hành trình chinh phục tiếng Anh của bạn.</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{data.stats.totalCompleted}</div>
                            <div className="text-xs text-slate-500">Bài đã hoàn thành</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {data.stats.averageScore || "--"}
                            </div>
                            <div className="text-xs text-slate-500">Điểm trung bình</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{data.stats.pendingCount}</div>
                            <div className="text-xs text-slate-500">Bài chưa làm</div>
                        </div>
                    </div>
                </div>

                <Link href="/student/classes" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition group">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{data.stats.totalClasses}</div>
                            <div className="text-xs text-slate-500">Lớp đang học</div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Assignments - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                <h2 className="font-semibold text-slate-900">Bài tập chưa làm</h2>
                            </div>
                            {data.stats.pendingCount > 6 && (
                                <span className="text-sm text-slate-500">
                                    +{data.stats.pendingCount - 6} bài khác
                                </span>
                            )}
                        </div>
                        {data.pendingAssignments.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="font-medium text-slate-900 mb-1">Tuyệt vời!</h3>
                                <p className="text-sm text-slate-500">Bạn đã hoàn thành tất cả bài tập.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {data.pendingAssignments.map((assignment) => (
                                    <Link
                                        key={assignment.id}
                                        href={`/learn/${assignment.classId}/assignments/${assignment.id}`}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                {assignmentTypeIcons[assignment.type] || <FileText className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 transition">
                                                    {assignment.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                                                        {assignment.className}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{assignmentTypeLabels[assignment.type] || assignment.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity - Takes 1 column */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-semibold text-slate-900">Hoạt động gần đây</h2>
                            </div>
                            <Link href="/student/history" className="text-sm text-indigo-600 hover:text-indigo-700">
                                Xem tất cả
                            </Link>
                        </div>
                        {data.recentActivity.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-medium text-slate-900 mb-1">Chưa có hoạt động</h3>
                                <p className="text-sm text-slate-500">Bắt đầu làm bài để theo dõi tiến trình.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {data.recentActivity.map((activity) => (
                                    <Link
                                        key={activity.id}
                                        href={`/learn/${activity.classId}/assignments/${activity.assignmentId}`}
                                        className="block px-6 py-4 hover:bg-slate-50 transition"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-900 text-sm truncate">
                                                    {activity.assignmentTitle}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {formatDistanceToNow(new Date(activity.submittedAt), {
                                                        addSuffix: true,
                                                        locale: vi
                                                    })}
                                                </p>
                                            </div>
                                            {activity.score !== null && (
                                                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${activity.score >= 7
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : activity.score >= 5
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}>
                                                    {activity.score} điểm
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}
