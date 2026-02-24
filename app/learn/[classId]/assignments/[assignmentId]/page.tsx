import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { LectureViewer } from "./_components/lecture-viewer";
import { QuizRunner } from "./_components/quiz-runner";
import { FileText, ClipboardList, Clock } from "lucide-react";

export default async function AssignmentIdPage({
    params
}: {
    params: { classId: string; assignmentId: string }
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect("/");
    }

    const assignment = await prisma.assignment.findUnique({
        where: {
            id: params.assignmentId,
        },
        include: {
            questions: true,
        }
    });

    if (!assignment) {
        return redirect("/");
    }

    const isQuiz = assignment.type !== "LECTURE";
    const Icon = isQuiz ? ClipboardList : FileText;

    return (
        <div className="h-full bg-slate-50">
            <div className="max-w-4xl mx-auto p-6">
                {/* Assignment Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isQuiz ? "bg-orange-50" : "bg-indigo-50"
                            }`}>
                            <Icon className={`w-6 h-6 ${isQuiz ? "text-orange-600" : "text-indigo-600"}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
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
                    <QuizRunner assignment={assignment} />
                )}
            </div>
        </div>
    );
}
