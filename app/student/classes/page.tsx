"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BookOpen,
    Loader2,
    PlayCircle,
    Users,
    Calendar,
    CheckCircle2,
    TrendingUp,
    Clock,
    ChevronRight,
    GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ClassData {
    id: string;
    title: string;
    description: string | null;
    progress: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    teacher?: {
        name: string;
    };
    joinedAt?: string;
}

export default function StudentClassesPage() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/student/dashboard")
            .then((res) => {
                if (res.ok) return res.json();
                return { classes: [] };
            })
            .then((result) => {
                setClasses(result.classes || []);
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

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lớp học của tôi</h1>
                        <p className="text-slate-500">Quản lý và theo dõi tiến độ các lớp bạn đang tham gia</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
                            <div className="text-xs text-slate-500">Tổng số lớp</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {classes.reduce((sum, c) => sum + c.completedAssignments, 0)}
                            </div>
                            <div className="text-xs text-slate-500">Bài đã hoàn thành</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {classes.reduce((sum, c) => sum + (c.totalAssignments - c.completedAssignments), 0)}
                            </div>
                            <div className="text-xs text-slate-500">Bài chưa làm</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa tham gia lớp học nào</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Liên hệ giáo viên để được thêm vào lớp học. Sau khi được thêm, các lớp sẽ hiển thị tại đây.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {classes.map((classItem) => (
                        <div
                            key={classItem.id}
                            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-200 transition group"
                        >
                            {/* Header Gradient */}
                            <div className="h-28 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_40%)]"></div>

                                {/* Class Title Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/30 to-transparent">
                                    <h3 className="text-xl font-bold text-white">{classItem.title}</h3>
                                </div>
                            </div>

                            <div className="p-5">
                                {/* Progress Section */}
                                <div className="mb-5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-700">Tiến độ hoàn thành</span>
                                        <span className="text-lg font-bold text-indigo-600">{classItem.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div
                                            className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                                            style={{ width: `${classItem.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-xs font-medium">Đã hoàn thành</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">
                                            {classItem.completedAssignments}/{classItem.totalAssignments}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-medium">Chưa làm</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">
                                            {classItem.totalAssignments - classItem.completedAssignments}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link href={`/learn/${classItem.id}`}>
                                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm group-hover:shadow-md">
                                        <PlayCircle className="w-5 h-5" />
                                        Vào học
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
