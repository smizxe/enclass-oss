"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
    Loader2,
    ArrowLeft,
    User,
    Calendar,
    BookOpen,
    Send,
    CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

interface SubmissionDetail {
    id: string;
    submittedAt: string;
    answers: string;
    score: number | null;
    feedback: string | null;
    gradedAt: string | null;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    assignmentProgress: {
        assignment: {
            id: string;
            title: string;
            questions: Array<{
                id: string;
                content: string;
                points: number;
            }>;
            class: {
                title: string;
            };
        };
    };
}

export default function GradeSubmissionPage() {
    const params = useParams();
    const router = useRouter();
    const submissionId = params.submissionId as string;

    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [score, setScore] = useState<number>(0);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const response = await fetch(`/api/teacher/grading/${submissionId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSubmission(data);
                    if (data.score !== null) {
                        setScore(data.score);
                        setFeedback(data.feedback || "");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch submission", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [submissionId]);

    const handleSubmitGrade = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/teacher/grading/${submissionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score, feedback })
            });

            if (response.ok) {
                toast.success("Đã chấm điểm thành công!");
                router.push("/teacher/grading");
            } else {
                toast.error("Có lỗi xảy ra khi chấm điểm");
            }
        } catch (error) {
            console.error("Failed to submit grade", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="p-6 text-center">
                <p className="text-slate-500">Không tìm thấy bài nộp.</p>
            </div>
        );
    }

    const parsedAnswers = JSON.parse(submission.answers);
    const isGraded = submission.gradedAt !== null;

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/teacher/grading"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Chấm điểm bài viết</h1>
            </div>

            {/* Student & Assignment Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">Học viên</div>
                            <div className="font-medium text-slate-900">
                                {submission.user.name || submission.user.email}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">Bài tập</div>
                            <div className="font-medium text-slate-900">
                                {submission.assignmentProgress.assignment.title}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">Nộp lúc</div>
                            <div className="font-medium text-slate-900">
                                {format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Student's Answers */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="font-semibold text-slate-900">Bài làm của học viên</h2>
                    {submission.assignmentProgress.assignment.questions.map((question, index) => (
                        <div key={question.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-700">Câu {index + 1}</span>
                                    <span className="text-sm text-slate-500">{question.points} điểm</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="text-slate-700 mb-4 whitespace-pre-wrap">{question.content}</div>
                                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                    <div className="text-xs text-indigo-600 font-medium mb-1">Câu trả lời:</div>
                                    <div className="text-slate-800 whitespace-pre-wrap">
                                        {parsedAnswers[question.id] || "(Không có câu trả lời)"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grading Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-6">
                        <h2 className="font-semibold text-slate-900 mb-4">
                            {isGraded ? "Kết quả chấm điểm" : "Chấm điểm"}
                        </h2>

                        {isGraded && (
                            <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-emerald-700 font-medium">Đã chấm điểm</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Điểm số (0-10)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={score}
                                    onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                                    disabled={isGraded}
                                    className="w-full px-4 py-3 text-2xl font-bold text-center border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nhận xét
                                </label>
                                <textarea
                                    rows={5}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    disabled={isGraded}
                                    placeholder="Nhập nhận xét cho học viên..."
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition resize-none disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>

                            {!isGraded && (
                                <button
                                    onClick={handleSubmitGrade}
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/25"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Lưu điểm
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
