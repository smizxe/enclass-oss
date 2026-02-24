"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Loader2,
    ClipboardCheck,
    User,
    Calendar,
    ChevronRight,
    BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Submission {
    id: string;
    submittedAt: string;
    answers: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    assignmentProgress: {
        assignment: {
            id: string;
            title: string;
            classId: string;
        };
    };
}

export default function GradingPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await fetch("/api/teacher/grading");
                if (response.ok) {
                    const data = await response.json();
                    setSubmissions(data);
                }
            } catch (error) {
                console.error("Failed to fetch submissions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Chấm điểm bài viết</h1>
                <p className="text-slate-500 mt-1">Xem và chấm điểm bài làm của học viên.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                        <ClipboardCheck className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{submissions.length}</div>
                        <div className="text-sm text-slate-500">Bài cần chấm</div>
                    </div>
                </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900">Danh sách bài nộp</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardCheck className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">Không có bài cần chấm</h3>
                        <p className="text-sm text-slate-500">Tất cả bài viết đã được chấm điểm.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {submissions.map((submission) => (
                            <Link
                                href={`/teacher/grading/${submission.id}`}
                                key={submission.id}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition group"
                            >
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition">
                                    <User className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-slate-900 truncate">
                                            {submission.user.name || submission.user.email}
                                        </h3>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                                            Chờ chấm
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            {submission.assignmentProgress.assignment.title}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(submission.submittedAt), "dd MMM yyyy, HH:mm", { locale: vi })}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
