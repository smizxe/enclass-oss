import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { LectureViewer } from "./_components/lecture-viewer";
import { QuizRunner } from "./_components/quiz-runner";
import { FileText, ClipboardList, Clock, RefreshCw, Lock } from "lucide-react";
import Link from "next/link";

export default async function AssignmentIdPage({
    params
}: {
    params: Promise<{ classId: string; assignmentId: string }>
}) {
    const session = await getServerSession(authOptions);
    const { classId, assignmentId } = await params;

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

    // Get settings
    const settings = assignment.settings as { maxAttempts?: number; timeLimitMinutes?: number; deadline?: string; passPercent?: number; prerequisiteAssignmentId?: string } | null;
    const maxAttempts = settings?.maxAttempts || 1;
    const timeLimitMinutes = settings?.timeLimitMinutes || 0;
    const deadline = settings?.deadline || null;

    // Check prerequisite assignment
    const prereqId = settings?.prerequisiteAssignmentId;
    let isPrereqLocked = false;
    let prereqTitle = "";

    if (prereqId) {
        const prereqAssignment = await prisma.assignment.findUnique({
            where: { id: prereqId },
            select: { title: true }
        });
        prereqTitle = prereqAssignment?.title || "bài tập trước";

        const prereqProgress = await prisma.assignmentProgress.findUnique({
            where: {
                userId_assignmentId: {
                    userId: session.user.id,
                    assignmentId: prereqId
                }
            }
        });

        if (!prereqProgress || prereqProgress.status !== "COMPLETED") {
            isPrereqLocked = true;
        }
    }

    // If prerequisite is not completed, show blocked UI
    if (isPrereqLocked) {
        return (
            <div className="h-full bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Bài tập bị khóa</h2>
                    <p className="text-slate-600 mb-6">
                        Bạn cần hoàn thành bài tập <span className="font-semibold text-orange-600">&quot;{prereqTitle}&quot;</span> trước khi có thể làm bài tập này.
                    </p>
                    <Link
                        href={`/learn/${classId}/assignments/${prereqId}`}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-sm"
                    >
                        Đi đến bài tập yêu cầu
                    </Link>
                </div>
            </div>
        );
    }

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
            <div className="max-w-[1800px] mx-auto h-full">
                {/* Content */}
                {assignment.type === "LECTURE" ? (
                    <LectureViewer
                        title={assignment.title}
                        content={assignment.content}
                    />
                ) : (
                    <QuizRunner
                        assignment={assignment}
                        initialSubmission={latestSubmission}
                        allSubmissions={allSubmissions}
                        maxAttempts={maxAttempts}
                        currentAttemptCount={currentAttemptCount}
                        isTestMode={assignment.isTestMode}
                        userId={session.user.id}
                        timeLimitMinutes={timeLimitMinutes}
                        deadline={deadline}
                    />
                )}
            </div>
        </div>
    );
}
