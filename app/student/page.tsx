"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BookOpen,
    Loader2,
    PlayCircle,
    Clock,
    Trophy
} from "lucide-react";

interface ClassItem {
    id: string;
    title: string;
    description: string | null;
}

export default function StudentDashboard() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/student/classes/available")
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

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Xin chào! 👋</h1>
                <p className="text-slate-500 mt-1">Tiếp tục hành trình chinh phục IELTS của bạn.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">12</div>
                        <div className="text-sm text-slate-500">Bài đã hoàn thành</div>
                    </div>
                </div>
                {/* ... other stats ... */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">7.5</div>
                        <div className="text-sm text-slate-500">Điểm trung bình</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">8h</div>
                        <div className="text-sm text-slate-500">Thời gian học tuần này</div>
                    </div>
                </div>
            </div>

            {/* Classes */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Lớp học của bạn</h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : classes.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">Chưa tham gia lớp học nào</h3>
                        <p className="text-sm text-slate-500">Liên hệ thầy Điệp để được thêm vào lớp.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((classItem) => (
                            <div
                                key={classItem.id}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-200 transition group"
                            >
                                {/* Course Header Image Placeholder */}
                                <div className="h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 relative">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50"></div>
                                    <div className="absolute bottom-4 left-4">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs font-medium">
                                            <BookOpen className="w-3 h-3" />
                                            IELTS
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition">
                                        {classItem.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                        {classItem.description || "Không có mô tả"}
                                    </p>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Tiến độ</span>
                                            <span className="font-medium text-slate-700">0%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full">
                                            <div className="w-0 bg-indigo-600 h-1.5 rounded-full"></div>
                                        </div>
                                    </div>

                                    <Link href={`/learn/${classItem.id}`}>
                                        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
                                            <PlayCircle className="w-4 h-4" />
                                            Vào học
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
