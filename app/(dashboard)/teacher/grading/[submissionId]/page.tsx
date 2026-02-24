"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import {
    Loader2,
    ArrowLeft,
    User,
    Calendar,
    BookOpen,
    Send,
    CheckCircle,
    Volume2,
    FileText,
    Bot,
    CheckSquare,
    XSquare,
    Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

interface SubmissionDetail {
    id: string;
    submittedAt: string;
    answers: string;
    score: number | null;
    feedback: string | null;  // AI feedback
    teacherFeedback: string | null;  // Teacher's own feedback
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
            type: string;
            questions: Array<{
                id: string;
                content: string;
                type: string;
                points: number;
                correctAnswer: string;
            }>;
            class: {
                title: string;
            };
        };
    };
}

// Helper: Safe JSON parse
function safeParseJSON(jsonString: string | null | undefined, fallback: unknown = null) {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch {
        return fallback;
    }
}

// Helper: Extract question text from JSON content
function getQuestionDisplay(content: string, type: string): { text: string; options?: string[] } {
    const parsed = safeParseJSON(content);
    if (parsed && typeof parsed === 'object') {
        if (type === 'MCQ' && parsed.options) {
            return {
                text: parsed.text || parsed.question || content,
                options: parsed.options
            };
        }
        if (type === 'GAP_FILL') {
            return { text: parsed.text || parsed.passage || content };
        }
        return { text: parsed.text || parsed.question || parsed.prompt || parsed.sectionTitle || "(Câu hỏi)" };
    }
    return { text: content };
}

// Helper: Check if answer is audio URL
function isAudioUrl(answer: string): boolean {
    if (!answer || typeof answer !== 'string') return false;
    return answer.includes('supabase') &&
        (answer.includes('/submissions/') || answer.includes('.m4a') || answer.includes('.webm') || answer.includes('.mp3') || answer.includes('.wav'));
}

// Helper: Parse AI feedback - extract full readable feedback text
function parseAIFeedbackForDisplay(feedback: string | null): string {
    if (!feedback) return "";

    const parsed = safeParseJSON(feedback);
    if (!parsed || typeof parsed !== 'object') return feedback;

    // It's a per-question feedback object
    const lines: string[] = [];
    for (const [, value] of Object.entries(parsed)) {
        if (value && typeof value === 'object') {
            const v = value as { isCorrect?: boolean; feedback?: string; correctAnswer?: string };
            if (v.feedback) {
                lines.push(v.feedback);
            }
        }
    }

    if (lines.length > 0) {
        return lines.join("\n\n---\n\n");
    }

    // Single feedback object
    if (parsed.feedback) return parsed.feedback;
    if (parsed.comment) return parsed.comment;
    if (parsed.evaluation) return parsed.evaluation;

    return feedback;
}

// Helper: Extract per-question AI feedback
function getQuestionAIFeedback(feedback: string | null, questionId: string): {
    isCorrect?: boolean;
    feedbackText: string;
    correctAnswer?: string;
} | null {
    if (!feedback) return null;

    const parsed = safeParseJSON(feedback);
    if (!parsed || typeof parsed !== 'object') return null;

    // Check if feedback is keyed by question ID
    if (parsed[questionId]) {
        const qFeedback = parsed[questionId];
        return {
            isCorrect: qFeedback.isCorrect,
            feedbackText: qFeedback.feedback || qFeedback.comment || "",
            correctAnswer: qFeedback.correctAnswer
        };
    }

    return null;
}

export default function GradeSubmissionPage() {
    const params = useParams();
    const router = useRouter();
    const submissionId = params.submissionId as string;

    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [score, setScore] = useState<number>(0);
    const [teacherFeedback, setTeacherFeedback] = useState("");

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const response = await fetch(`/api/teacher/grading/${submissionId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSubmission(data);
                    if (data.score !== null) {
                        setScore(data.score);
                    }
                    // Load teacher's own feedback if exists
                    if (data.teacherFeedback) {
                        setTeacherFeedback(data.teacherFeedback);
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

    // Parse answers safely
    const parsedAnswers = useMemo(() => {
        if (!submission) return {};
        return safeParseJSON(submission.answers, {}) as Record<string, unknown>;
    }, [submission]);

    // Get parsed AI feedback for display
    const aiFeedbackText = useMemo(() => {
        if (!submission?.feedback) return "";
        return parseAIFeedbackForDisplay(submission.feedback);
    }, [submission]);

    const handleSubmitGrade = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/teacher/grading/${submissionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score, teacherFeedback })
            });

            if (response.ok) {
                toast.success("Đã lưu điểm thành công!");
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

    const hasScore = submission.score !== null;
    const isGradedByTeacher = submission.gradedById !== null;

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
                <h1 className="text-2xl font-bold text-slate-900">
                    Chấm điểm bài tập
                </h1>
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
                    {submission.assignmentProgress.assignment.questions.map((question, index) => {
                        const { text: questionText, options } = getQuestionDisplay(question.content, question.type);
                        const answer = parsedAnswers[question.id];
                        const isAudio = typeof answer === 'string' && isAudioUrl(answer);
                        const qFeedback = getQuestionAIFeedback(submission.feedback, question.id);

                        return (
                            <div key={question.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isAudio ? (
                                                <Volume2 className="w-4 h-4 text-indigo-500" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-slate-500" />
                                            )}
                                            <span className="font-medium text-slate-700">Câu {index + 1}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">{question.type}</span>
                                        </div>
                                        <span className="text-sm text-slate-500">{question.points} điểm</span>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    {/* Question Text */}
                                    <div className="text-slate-700">
                                        <span className="font-medium text-slate-900">Đề bài:</span>{" "}
                                        {questionText}
                                    </div>

                                    {/* MCQ Options if available */}
                                    {options && options.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-slate-500">Các lựa chọn:</div>
                                            <div className="grid gap-2">
                                                {options.map((opt, i) => (
                                                    <div
                                                        key={i}
                                                        className={`px-3 py-2 rounded-lg border text-sm ${String(answer) === String(i) || String(answer) === opt
                                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                                            }`}
                                                    >
                                                        <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                                                        {(String(answer) === String(i) || String(answer) === opt) && (
                                                            <span className="ml-2 text-xs font-bold">(Đã chọn)</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Student Answer for non-MCQ */}
                                    {!options && (
                                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                            <div className="text-xs text-indigo-600 font-medium mb-2">Câu trả lời:</div>
                                            {isAudio ? (
                                                <audio
                                                    controls
                                                    className="w-full"
                                                    src={answer as string}
                                                >
                                                    Trình duyệt không hỗ trợ audio.
                                                </audio>
                                            ) : answer ? (
                                                <div className="text-slate-800 whitespace-pre-wrap">
                                                    {typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2)}
                                                </div>
                                            ) : (
                                                <div className="text-slate-400 italic">(Không có câu trả lời)</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Per-question AI Feedback */}
                                    {qFeedback && qFeedback.feedbackText && (
                                        <div className={`rounded-lg p-4 border ${qFeedback.isCorrect === true
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : qFeedback.isCorrect === false
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-blue-50 border-blue-200'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {qFeedback.isCorrect === true && <CheckSquare className="w-4 h-4 text-emerald-600" />}
                                                {qFeedback.isCorrect === false && <XSquare className="w-4 h-4 text-red-600" />}
                                                <Bot className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs font-medium text-slate-600">Nhận xét AI:</span>
                                            </div>
                                            <div className="text-sm text-slate-700 prose prose-sm max-w-none">
                                                <ReactMarkdown>{qFeedback.feedbackText}</ReactMarkdown>
                                            </div>
                                            {qFeedback.correctAnswer && (
                                                <div className="mt-2 text-sm text-emerald-700">
                                                    <span className="font-medium">Đáp án đúng:</span> {qFeedback.correctAnswer}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Full AI Feedback Section */}
                    {aiFeedbackText && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-blue-100/50 border-b border-blue-200 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">Nhận xét AI (Tổng hợp)</span>
                            </div>
                            <div className="p-5">
                                <div className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-strong:text-slate-900 prose-li:text-slate-700">
                                    <ReactMarkdown>{aiFeedbackText}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grading Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-6">
                        <h2 className="font-semibold text-slate-900 mb-4">
                            Chấm điểm
                        </h2>

                        {/* Status Badge */}
                        {hasScore && (
                            <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${isGradedByTeacher
                                    ? 'bg-emerald-50 border-emerald-100'
                                    : 'bg-blue-50 border-blue-100'
                                }`}>
                                {isGradedByTeacher ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        <span className="text-sm text-emerald-700 font-medium">Đã chấm bởi giáo viên</span>
                                    </>
                                ) : (
                                    <>
                                        <Bot className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-blue-700 font-medium">Đã chấm bởi AI</span>
                                    </>
                                )}
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
                                    step="0.1"
                                    value={score}
                                    onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 text-2xl font-bold text-center border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nhận xét của giáo viên
                                </label>
                                <textarea
                                    rows={6}
                                    value={teacherFeedback}
                                    onChange={(e) => setTeacherFeedback(e.target.value)}
                                    disabled={isSubmitting}
                                    placeholder="Nhập nhận xét của bạn cho học viên... (Nhận xét AI đã được lưu riêng)"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition resize-none disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>

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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
