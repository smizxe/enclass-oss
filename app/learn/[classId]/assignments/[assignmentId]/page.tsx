import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { LectureViewer } from "./_components/lecture-viewer";
import { QuizRunner } from "./_components/quiz-runner";
import { FileText, ClipboardList, Clock, RefreshCw } from "lucide-react";

export default async function AssignmentIdPage({
    params
}: {
    params: Promise<{ classId: string; assignmentId: string }>
}) {
    const session = await getServerSession(authOptions);
    const { assignmentId } = await params;

    if (!session) {
        return redirect("/");
    }

    const assignment = await prisma.assignment.findUnique({
        where: {
            id: assignmentId,
        },
        include: {
            questions: {
                orderBy: [
                    { orderIndex: "asc" },
                    { createdAt: "asc" }
                ],
            },
        }
    });

    if (!assignment) {
        return redirect("/");
    }

    // Get max attempts from settings
    const settings = assignment.settings as { maxAttempts?: number } | null;
    const maxAttempts = settings?.maxAttempts || 1;

    // Fetch ALL submissions for this user (not just latest)
    const progress = await prisma.assignmentProgress.findUnique({
        where: {
            userId_assignmentId: {
                userId: session.user.id,
                assignmentId
            }
        },
        include: {
            submissions: {
                orderBy: { submittedAt: 'asc' }  // Order by submission time
            }
        }
    });

    const allSubmissions = progress?.submissions || [];
    const latestSubmission = allSubmissions.length > 0
        ? allSubmissions[allSubmissions.length - 1]
        : null;
    const currentAttemptCount = allSubmissions.length;

    const isQuiz = assignment.type !== "LECTURE";
    const Icon = isQuiz ? ClipboardList : FileText;

    return (
        <div className="h-full bg-slate-50">
            <div className="max-w-[1800px] mx-auto p-4 md:p-6">
                {/* Assignment Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isQuiz ? "bg-orange-50" : "bg-indigo-50"
                            }`}>
                            <Icon className={`w-6 h-6 ${isQuiz ? "text-orange-600" : "text-indigo-600"}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isQuiz
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-indigo-50 text-indigo-700"
                                    }`}>
                                    {isQuiz ? "Bài tập" : "Bài giảng"}
                                </span>
                                {isQuiz && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {assignment.questions.length} câu hỏi
                                    </span>
                                )}
                                {/* Max Attempts Badge */}
                                {isQuiz && maxAttempts > 1 && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <RefreshCw className="w-3 h-3" />
                                        Được làm {maxAttempts} lần
                                    </span>
                                )}
                                {/* Current Attempt Info */}
                                {isQuiz && currentAttemptCount > 0 && (
                                    <span className="text-xs text-slate-500">
                                        • Đã làm {currentAttemptCount}/{maxAttempts} lần
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {assignment.title}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {assignment.type === "LECTURE" ? (
                    <LectureViewer content={assignment.content} />
                ) : (
                    <QuizRunner
                        assignment={assignment}
                        initialSubmission={latestSubmission}
                        allSubmissions={allSubmissions}
                        maxAttempts={maxAttempts}
                        currentAttemptCount={currentAttemptCount}
                    />
                )}
            </div>
        </div>
    );
}
