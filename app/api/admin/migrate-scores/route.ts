import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Migration API to fix old submission scores
 * Recalculates scores from stored AI feedback data
 * Only accessible by TEACHER/ADMIN
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get all submissions with null or 0 score that have feedback
        const submissions = await prisma.submission.findMany({
            where: {
                OR: [
                    { score: null },
                    { score: 0 }
                ],
                feedback: { not: null }
            },
            include: {
                assignmentProgress: {
                    include: {
                        assignment: {
                            include: {
                                questions: true
                            }
                        }
                    }
                }
            }
        });

        let fixedCount = 0;
        const fixedSubmissions: string[] = [];

        for (const submission of submissions) {
            try {
                // Parse the feedback JSON
                const feedback = JSON.parse(submission.feedback || "{}");
                const answers = JSON.parse(submission.answers || "{}");
                const questions = submission.assignmentProgress.assignment.questions;

                let calculatedScore = 0;

                for (const question of questions) {
                    const result = feedback[question.id];

                    if (result?.score !== undefined) {
                        // AI-graded question - use AI score
                        calculatedScore += result.score;
                    } else if (result?.isCorrect) {
                        // Auto-graded question (MCQ, etc) - use full points if correct
                        calculatedScore += question.points;
                    }
                    // If no result, score stays 0 for that question
                }

                // Update submission score
                await prisma.submission.update({
                    where: { id: submission.id },
                    data: { score: calculatedScore }
                });

                // Also update AssignmentProgress score
                await prisma.assignmentProgress.update({
                    where: { id: submission.assignmentProgressId },
                    data: { score: calculatedScore }
                });

                fixedCount++;
                fixedSubmissions.push(submission.id);

            } catch (parseError) {
                console.error(`Error processing submission ${submission.id}:`, parseError);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Fixed ${fixedCount} submissions`,
            fixedSubmissions
        });

    } catch (error) {
        console.error("[MIGRATE_SCORES]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * GET - Preview what will be fixed
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const submissions = await prisma.submission.findMany({
            where: {
                OR: [
                    { score: null },
                    { score: 0 }
                ],
                feedback: { not: null }
            },
            include: {
                user: { select: { name: true, email: true } },
                assignmentProgress: {
                    include: {
                        assignment: { select: { title: true } }
                    }
                }
            }
        });

        return NextResponse.json({
            count: submissions.length,
            submissions: submissions.map(s => ({
                id: s.id,
                student: s.user.name || s.user.email,
                assignment: s.assignmentProgress.assignment.title,
                currentScore: s.score,
                submittedAt: s.submittedAt
            }))
        });

    } catch (error) {
        console.error("[MIGRATE_SCORES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
