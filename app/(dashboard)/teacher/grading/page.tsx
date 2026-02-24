"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Loader2,
    ClipboardCheck,
    Calendar,
    ChevronRight,
    BookOpen,
    School,
    ArrowLeft,
    CheckCircle,
    Bot,
    Pencil
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Types
interface Class {
    id: string;
    title: string;
    description: string | null;
}

interface Assignment {
    id: string;
    title: string;
    type: string;
    classId: string;
}

interface Submission {
    id: string;
    submittedAt: string;
    answers: string;
    score: number | null;
    feedback: string | null;
    gradedAt: string | null;
    gradedById: string | null;
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
    // State for navigation/layers
    const [view, setView] = useState<"CLASSES" | "ASSIGNMENTS" | "SUBMISSIONS">("CLASSES");
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    // Data State
    const [classes, setClasses] = useState<Class[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Load: Fetch Classes
    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/teacher/classes");
                if (response.ok) {
                    const data = await response.json();
                    setClasses(data);
                }
            } catch (error) {
                console.error("Failed to fetch classes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    // Fetch Assignments when Class Selected
    const handleSelectClass = async (cls: Class) => {
        setSelectedClass(cls);
        setLoading(true);
        try {
            const response = await fetch(`/api/teacher/classes/${cls.id}`);
            if (response.ok) {
                const data = await response.json();
                setAssignments(data.assignments || []);
                setView("ASSIGNMENTS");
            }
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Submissions when Assignment Selected
    const handleSelectAssignment = async (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setLoading(true);
        try {
            const response = await fetch(`/api/teacher/grading?assignmentId=${assignment.id}`);
            if (response.ok) {
                const data = await response.json();
                setSubmissions(data);
                setView("SUBMISSIONS");
            }
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setLoading(false);
        }
    };

    // Navigation handlers
    const goBack = () => {
        if (view === "SUBMISSIONS") {
            setView("ASSIGNMENTS");
            setSelectedAssignment(null);
        } else if (view === "ASSIGNMENTS") {
            setView("CLASSES");
            setSelectedClass(null);
        }
    };

    // Helper to determine grading status
    const getGradingStatus = (submission: Submission) => {
        const hasScore = submission.score !== null;
        const isGradedByTeacher = submission.gradedById !== null;

        if (!hasScore) {
            return { type: "pending", label: "Chờ chấm", color: "orange" };
        }
        if (isGradedByTeacher) {
            return { type: "teacher", label: `${submission.score} điểm`, color: "emerald" };
        }
        // Has score but no teacher graded = AI graded
        return { type: "ai", label: `AI: ${submission.score} điểm`, color: "blue" };
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header with Breadcrumbs */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span
                        className={view === "CLASSES" ? "font-bold text-indigo-600" : "cursor-pointer hover:text-indigo-600"}
                        onClick={() => { setView("CLASSES"); setSelectedClass(null); }}
                    >
                        Lớp học
                    </span>
                    {selectedClass && (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            <span
                                className={view === "ASSIGNMENTS" ? "font-bold text-indigo-600" : "cursor-pointer hover:text-indigo-600"}
                                onClick={() => { setView("ASSIGNMENTS"); setSelectedAssignment(null); }}
                            >
                                {selectedClass.title}
                            </span>
                        </>
                    )}
                    {selectedAssignment && (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            <span className="font-bold text-indigo-600">{selectedAssignment.title}</span>
                        </>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {view === "CLASSES" && "Chọn Lớp Học"}
                    {view === "ASSIGNMENTS" && "Danh sách Bài tập"}
                    {view === "SUBMISSIONS" && "Danh sách Bài nộp"}
                </h1>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            )}

            {/* Classes View */}
            {!loading && view === "CLASSES" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div
                            key={cls.id}
                            onClick={() => handleSelectClass(cls)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                                <School className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{cls.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{cls.description || "Không có mô tả"}</p>
                            <div className="mt-4 flex items-center text-sm font-medium text-indigo-600">
                                Xem bài tập <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            Chưa có lớp học nào.
                        </div>
                    )}
                </div>
            )}

            {/* Assignments View */}
            {!loading && view === "ASSIGNMENTS" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button onClick={goBack} className="md:col-span-2 lg:col-span-3 flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Quay lại
                    </button>
                    {assignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            onClick={() => handleSelectAssignment(assignment)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition">
                                <BookOpen className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">{assignment.title}</h3>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mt-2">
                                {assignment.type}
                            </span>
                        </div>
                    ))}
                    {assignments.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                            Lớp học này chưa có bài tập nào.
                        </div>
                    )}
                </div>
            )}

            {/* Submissions View */}
            {!loading && view === "SUBMISSIONS" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <button onClick={goBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài tập
                        </button>
                        <span className="text-sm text-slate-500">{submissions.length} bài nộp</span>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClipboardCheck className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="font-medium text-slate-900">Chưa có bài nộp nào</h3>
                            <p className="text-sm text-slate-500">Học viên chưa nộp bài cho bài tập này.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {submissions.map((submission) => {
                                const status = getGradingStatus(submission);
                                return (
                                    <Link
                                        href={`/teacher/grading/${submission.id}`}
                                        key={submission.id}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition group"
                                    >
                                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
                                            {(submission.user.name || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-medium text-slate-900 truncate">
                                                    {submission.user.name || submission.user.email}
                                                </h3>
                                                {status.type === "pending" && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> {status.label}
                                                    </span>
                                                )}
                                                {status.type === "ai" && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                                                        <Bot className="w-3 h-3" /> {status.label}
                                                    </span>
                                                )}
                                                {status.type === "teacher" && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> {status.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Nộp: {format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition flex items-center gap-1.5">
                                                <Pencil className="w-3.5 h-3.5" />
                                                {status.type === "pending" ? "Chấm điểm" : "Xem / Sửa"}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
