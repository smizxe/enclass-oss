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
                    />
                )}
            </div>
        </div>
    );
}
