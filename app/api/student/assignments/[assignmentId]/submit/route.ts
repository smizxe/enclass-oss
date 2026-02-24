import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST: Submit answers for an assignment
export async function POST(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;
        const body = await req.json();
        const { answers } = body;

        if (!answers || typeof answers !== "object") {
            return new NextResponse("Invalid answers format", { status: 400 });
        }

        // Fetch assignment with questions to grade
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { questions: true }
        });

        if (!assignment) {
            return new NextResponse("Assignment not found", { status: 404 });
        }

        // Calculate Score & Grade
        let totalScore = 0;
        let earnedScore = 0;
        const results: Record<string, { isCorrect: boolean; correctAnswer: any }> = {};

        assignment.questions.forEach(q => {
            totalScore += q.points;
            const userAnswer = answers[q.id];
            let isCorrect = false;

            // Manual parsing of content
            let parsedContent;
            try {
                parsedContent = JSON.parse(q.content);
            } catch {
                parsedContent = { text: q.content };
            }

            if (q.type === "MCQ") {
                // Robust checking for MCQ
                // 1. Direct match (Text == Text) or (Letter == Letter)
                if (userAnswer === q.correctAnswer) {
                    isCorrect = true;
                }
                // 2. Check if correctAnswer is a Letter Key (A, B, C...) and userAnswer is the corresponding text
                else if (parsedContent.options && Array.isArray(parsedContent.options)) {
                    const correctIndex = q.correctAnswer.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
                    if (correctIndex >= 0 && correctIndex < parsedContent.options.length) {
                        const correctOptionText = parsedContent.options[correctIndex];
                        if (userAnswer === correctOptionText) {
                            isCorrect = true;
                        }
                    }
                }

                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            } else if (q.type === "ORDERING") {
                // For ordering, usually checked against exact string match or specific logic. 
                // Assuming Simple exact match for now as per current schema behavior
                if (userAnswer === q.correctAnswer) {
                    isCorrect = true;
                }
                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            } else if (q.type === "GAP_FILL") {
                // Gap fill logic would be complex. For MVP, assuming exact match roughly
                // This might need refinement based on exact gap fill storage format
                // For now, let's assume manual grading for GapFill or simple match if structured
                if (userAnswer === q.correctAnswer) isCorrect = true;
                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            } else {
                // Essay or other types: Pending Grading
                results[q.id] = { isCorrect: false, correctAnswer: null };
            }

            if (isCorrect) {
                earnedScore += q.points;
            }
        });

        // Get or create assignment progress
        let progress = await prisma.assignmentProgress.findUnique({
            where: {
                userId_assignmentId: {
                    userId: session.user.id,
                    assignmentId
                }
            },
            include: { assignment: true }
        });

        if (!progress) {
            progress = await prisma.assignmentProgress.create({
                data: {
                    userId: session.user.id,
                    assignmentId,
                    status: "IN_PROGRESS"
                },
                include: { assignment: true }
            });
        }

        // Check assignment type to determine status
        const isEssay = progress.assignment.type === "ESSAY";
        const newStatus = isEssay ? "PENDING_GRADING" : "COMPLETED";

        // Create submission
        const submission = await prisma.submission.create({
            data: {
                userId: session.user.id,
                assignmentProgressId: progress.id,
                answers: JSON.stringify(answers),
                score: earnedScore
            }
        });

        // Update progress status
        await prisma.assignmentProgress.update({
            where: { id: progress.id },
            data: { status: newStatus }
        });

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            status: newStatus,
            score: earnedScore,
            totalScore: totalScore,
            results: results
        });
    } catch (error) {
        console.error("[SUBMIT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
