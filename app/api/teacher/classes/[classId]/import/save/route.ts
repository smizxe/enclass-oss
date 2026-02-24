import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface QuestionInput {
    type: string;
    content: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string | null;
    passage?: string | null;
}

export async function POST(
    req: Request,
    { params }: { params: { classId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { title, questions } = await req.json() as { title: string; questions: QuestionInput[] };

        if (!title || !questions || questions.length === 0) {
            return new NextResponse("Missing title or questions", { status: 400 });
        }

        // Verify class ownership
        const classData = await prisma.class.findFirst({
            where: {
                id: params.classId,
                teacherId: session.user.id,
            },
        });

        if (!classData) {
            return new NextResponse("Class not found or unauthorized", { status: 404 });
        }

        // Get max orderIndex
        const lastAssignment = await prisma.assignment.findFirst({
            where: { classId: params.classId },
            orderBy: { orderIndex: "desc" },
        });

        const nextOrderIndex = (lastAssignment?.orderIndex ?? -1) + 1;

        // Determine assignment type based on questions
        const hasEssay = questions.some((q) => q.type === "ESSAY");
        const hasMCQ = questions.some((q) => q.type === "MCQ" || q.type === "READING_MCQ");
        let assignmentType = "QUIZ";
        if (hasEssay && !hasMCQ) {
            assignmentType = "ESSAY";
        } else if (hasMCQ) {
            assignmentType = "QUIZ";
        }

        // Create Assignment with Questions
        const assignment = await prisma.assignment.create({
            data: {
                title,
                classId: params.classId,
                orderIndex: nextOrderIndex,
                type: assignmentType,
                questions: {
                    create: questions.map((q) => {
                        // Build content JSON including passage if available
                        const contentData: { text: string; options?: string[]; passage?: string } = {
                            text: q.content,
                        };
                        if (q.options && q.options.length > 0) {
                            contentData.options = q.options;
                        }
                        if (q.passage) {
                            contentData.passage = q.passage;
                        }

                        return {
                            type: q.type || "MCQ",
                            content: JSON.stringify(contentData),
                            correctAnswer: q.correctAnswer || "",
                            explanation: q.explanation || null,
                            points: 1,
                        };
                    }),
                },
            },
            include: {
                questions: true,
            },
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.log("[IMPORT_SAVE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
