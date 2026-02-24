import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, FileText, ArrowRight, Mic, PenTool, ListChecks, BookOpen } from "lucide-react";

// Helper to get assignment type info
function getAssignmentTypeInfo(type: string, questions: { type: string }[]) {
    const hasSpeaking = questions.some(q => q.type === "SPEAKING");
    const hasWriting = questions.some(q => q.type === "WRITING" || q.type === "ESSAY");
    const hasMCQ = questions.some(q => q.type === "MCQ" || q.type === "GAP_FILL");

    if (type === "LECTURE") {
        return { label: "Bài giảng", color: "bg-indigo-100 text-indigo-700", icon: BookOpen };
    }
    if (hasSpeaking && hasWriting) {
        return { label: "Speaking & Writing", color: "bg-purple-100 text-purple-700", icon: Mic };
    }
    if (hasSpeaking) {
        return { label: "Speaking", color: "bg-rose-100 text-rose-700", icon: Mic };
    }
    if (hasWriting) {
        return { label: "Writing", color: "bg-amber-100 text-amber-700", icon: PenTool };
    }
    if (hasMCQ) {
        return { label: "Trắc nghiệm", color: "bg-emerald-100 text-emerald-700", icon: ListChecks };
    }
    return { label: "Bài tập", color: "bg-slate-100 text-slate-700", icon: FileText };
}

export default async function StudentHistoryPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return redirect("/");
    }

    // Fetch ALL completed/submitted assignments (not just AI ones)
    const rawProgressList = await prisma.assignmentProgress.findMany({
        where: {
            userId: session.user.id,
            // Include any status that indicates the student has interacted with the assignment
            status: {
                in: ["COMPLETED", "PENDING_GRADING", "IN_PROGRESS"]
            }
        },
        include: {
            assignment: {
                include: {
                    class: {
                        select: {
                            id: true,
                            title: true
                        }
                    },
                    questions: {
                        select: {
                            type: true,
                            points: true
                        }
                    }
                }
            },
            submissions: {
                orderBy: { submittedAt: 'desc' },
                take: 1
            }
        },
    });

    // Sort by most recent submission first
    const progressList = rawProgressList.sort((a, b) => {
        const dateA = a.submissions[0]?.submittedAt ? new Date(a.submissions[0].submittedAt).getTime() : 0;
        const dateB = b.submissions[0]?.submittedAt ? new Date(b.submissions[0].submittedAt).getTime() : 0;
        return dateB - dateA;
    });

    // Stats
    const completedCount = progressList.filter(p => p.status === "COMPLETED").length;
    const totalScore = progressList.reduce((acc, p) => acc + (p.submissions[0]?.score || 0), 0);
    const avgScore = progressList.length > 0
        ? Math.round(totalScore / progressList.filter(p => p.submissions[0]?.score !== null).length) || 0
        : 0;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">📚 Lịch sử làm bài</h1>
                <p className="text-slate-500">Xem lại tất cả các bài tập bạn đã hoàn thành</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="text-3xl font-bold">{progressList.length}</div>
                    <div className="text-indigo-100 text-sm">Bài tập đã làm</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="text-3xl font-bold">{completedCount}</div>
                    <div className="text-emerald-100 text-sm">Bài hoàn thành</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="text-3xl font-bold">{avgScore || "---"}</div>
                    <div className="text-amber-100 text-sm">Điểm trung bình</div>
                </div>
            </div>

            {/* Assignment List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {progressList.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-700 mb-1">Chưa có bài tập nào</h3>
                        <p className="text-slate-500 text-sm">Hãy bắt đầu làm bài tập để xem lịch sử tại đây</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {progressList.map((progress) => {
                            const submission = progress.submissions[0];
                            const assignment = progress.assignment;
                            const classInfo = assignment.class;
                            const typeInfo = getAssignmentTypeInfo(assignment.type, assignment.questions);
                            const TypeIcon = typeInfo.icon;

                            // Calculate score display
                            let scoreDisplay = "Chưa chấm";
                            let scoreClass = "text-slate-400";
                            if (submission && submission.score !== null) {
                                const maxScore = assignment.questions.reduce((acc, q) => acc + q.points, 0);
                                const percentage = Math.round((submission.score / maxScore) * 100);
                                scoreDisplay = `${submission.score}/${maxScore}`;
                                scoreClass = percentage >= 80 ? "text-emerald-600" : percentage >= 50 ? "text-amber-600" : "text-rose-600";
                            } else if (progress.status === "PENDING_GRADING") {
                                scoreDisplay = "Đang chấm...";
                                scoreClass = "text-amber-500";
                            } else if (progress.status === "IN_PROGRESS") {
                                scoreDisplay = "Đang làm";
                                scoreClass = "text-blue-500";
                            }

                            return (
                                <Link
                                    key={progress.id}
                                    href={`/learn/${classInfo.id}/assignments/${assignment.id}`}
                                    className="block p-5 hover:bg-slate-50 transition group"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left: Icon & Info */}
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                                                <TypeIcon className="w-7 h-7" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                                                        {assignment.title}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${typeInfo.color}`}>
                                                        {typeInfo.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                                    <span className="truncate">{classInfo.title}</span>
                                                    <span className="shrink-0">•</span>
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {submission?.submittedAt
                                                            ? new Date(submission.submittedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                            : "---"
                                                        }
                                                    </span>
                                                    <span className="shrink-0">•</span>
                                                    <span className="shrink-0">{assignment.questions.length} câu</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Score & Arrow */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400 mb-0.5">Điểm số</div>
                                                <div className={`text-lg font-bold ${scoreClass}`}>
                                                    {scoreDisplay}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition">
                                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
