"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    PlusCircle,
    BookOpen,
    Users,
    TrendingUp,
    Loader2,
    ChevronRight,
    Clock
} from "lucide-react";

interface ClassItem {
    id: string;
    title: string;
    description: string | null;
    published: boolean;
    createdAt: string;
}

export default function TeacherDashboard() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/teacher/classes")
            .then((res) => {
                if (res.ok) return res.json();
                return [];
            })
            .then((data) => {
                setClasses(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const publishedCount = classes.filter(c => c.published).length;

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Xin chào, Thầy Điệp! 👋</h1>
                    <p className="text-slate-500 mt-1">Quản lý lớp học và theo dõi học viên.</p>
                </div>
                <Link href="/teacher/classes/create">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/25">
                        <PlusCircle className="w-4 h-4" />
                        Tạo lớp học mới
                    </button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            Tổng cộng
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{classes.length}</div>
                    <div className="text-sm text-slate-500 mt-1">Lớp học</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            Hoạt động
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{publishedCount}</div>
                    <div className="text-sm text-slate-500 mt-1">Đã kích hoạt</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            Học viên
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">--</div>
                    <div className="text-sm text-slate-500 mt-1">Tổng số học viên</div>
                </div>
            </div>

            {/* Classes List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Danh sách lớp học</h2>
                    <Link href="/teacher/classes" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        Xem tất cả
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">Chưa có lớp học nào</h3>
                        <p className="text-sm text-slate-500 mb-4">Bắt đầu bằng cách tạo lớp học đầu tiên.</p>
                        <Link href="/teacher/classes/create">
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
                                Tạo lớp học
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {classes.slice(0, 5).map((classItem) => (
                            <Link
                                href={`/teacher/classes/${classItem.id}`}
                                key={classItem.id}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition group"
                            >
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition">
                                    <BookOpen className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-slate-900 truncate">{classItem.title}</h3>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classItem.published
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-yellow-50 text-yellow-700"
                                            }`}>
                                            {classItem.published ? "Đang mở" : "Chưa kích hoạt"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">
                                        {classItem.description || "Chưa có mô tả"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {new Date(classItem.createdAt).toLocaleDateString("vi-VN")}
                                    </div>
                                    <ChevronRight className="w-5 h-5 group-hover:text-indigo-600 transition" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
