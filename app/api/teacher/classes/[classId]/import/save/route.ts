import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Question {
    questionNumber?: number;
    type: string;
    content: string;
    items?: string[];  // For ORDERING questions
    options?: string[];
    correctAnswer?: string;
    explanation?: string | null;
}

interface Section {
    title: string;
    type: string;
    passage?: string | null;
    passageTranslation?: string | null;
    questions: Question[];
}

interface ImportPayload {
    title: string;
    sections: Section[];
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ classId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { classId } = await params;
        const { title, sections } = await req.json() as ImportPayload;

        if (!title || !sections || sections.length === 0) {
            return new NextResponse("Missing title or sections", { status: 400 });
        }

        // Verify class ownership
        const classData = await prisma.class.findFirst({
            where: {
                id: classId,
                teacherId: session.user.id,
            },
        });

        if (!classData) {
            return new NextResponse("Class not found or unauthorized", { status: 404 });
        }

        // Get max orderIndex
        const lastAssignment = await prisma.assignment.findFirst({
            where: { classId },
            orderBy: { orderIndex: "desc" },
        });

        const nextOrderIndex = (lastAssignment?.orderIndex ?? -1) + 1;

        // Flatten sections into questions for database
        const flatQuestions: {
            type: string;
            content: string;
            correctAnswer: string;
            explanation: string | null;
            points: number;
        }[] = [];

        for (const section of sections) {
            for (const q of section.questions) {
                // Build content JSON including all relevant data
                const contentData: {
                    text: string;
                    items?: string[];      // For ORDERING questions
                    options?: string[];
                    passage?: string;
                    passageTranslation?: string;
                    sectionTitle?: string;
                    sectionType?: string;
                } = {
                    text: q.content || "",
                };

                // Store items for ORDERING questions
                if (q.items && q.items.length > 0) {
                    contentData.items = q.items;
                }

                if (q.options && q.options.length > 0) {
                    contentData.options = q.options;
                }

                // Include passage from section
                if (section.passage) {
                    contentData.passage = section.passage;
                }

                // Include passage translation if available
                if (section.passageTranslation) {
                    contentData.passageTranslation = section.passageTranslation;
                }

                contentData.sectionTitle = section.title;
                contentData.sectionType = section.type;

                flatQuestions.push({
                    type: q.type || "MCQ",
                    content: JSON.stringify(contentData),
                    correctAnswer: q.correctAnswer || "",
                    explanation: q.explanation || null,
                    points: 1,
                });
            }
        }

        // Determine assignment type
        const hasReading = sections.some((s) => s.type === "READING");
        const assignmentType = hasReading ? "QUIZ" : "QUIZ";

        // Create Assignment with Questions
        const assignment = await prisma.assignment.create({
            data: {
                title,
                classId,
                orderIndex: nextOrderIndex,
                type: assignmentType,
                questions: {
                    create: flatQuestions,
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
