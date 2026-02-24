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

        // Verify user exists in DB (to catch stale sessions after DB reset)
        const userExists = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!userExists) {
            return new NextResponse("User record not found. Please log out and log in again.", { status: 401 });
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

        // Get max attempts from settings
        const settings = assignment.settings as { maxAttempts?: number } | null;
        const maxAttempts = settings?.maxAttempts || 1;

        // Check existing progress and submissions
        const existingProgress = await prisma.assignmentProgress.findUnique({
            where: {
                userId_assignmentId: {
                    userId: session.user.id,
                    assignmentId
                }
            },
            include: {
                assignment: true,
                submissions: {
                    orderBy: { submittedAt: 'asc' }
                }
            }
        });

        const currentAttemptCount = existingProgress?.submissions.length || 0;

        // Check if max attempts reached
        if (currentAttemptCount >= maxAttempts) {
            return new NextResponse(
                `Đã hết lượt làm bài. Bạn chỉ được làm ${maxAttempts} lần.`,
                { status: 403 }
            );
        }

        const nextAttemptNumber = currentAttemptCount + 1;

        // Calculate Score & Grade
        let totalScore = 0;
        let earnedScore = 0;
        const results: Record<string, { isCorrect: boolean; correctAnswer: any }> = {};

        // Build Section Context Map (SectionTitle -> Passage)
        const sectionPassageMap = new Map<string, string>();
        assignment.questions.forEach(q => {
            if (q.type === "SECTION_HEADER") {
                try {
                    const parsed = JSON.parse(q.content);
                    if (parsed.sectionTitle && parsed.passage) {
                        sectionPassageMap.set(parsed.sectionTitle, parsed.passage);
                    }
                } catch { }
            }
        });

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
                // Gap fill - compare typed answer (case-insensitive, trimmed)
                const userTyped = typeof userAnswer === 'string' ? userAnswer.trim().toLowerCase() : '';
                const correctTyped = q.correctAnswer.trim().toLowerCase();
                if (userTyped === correctTyped) {
                    isCorrect = true;
                }
                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            } else if (q.type === "SPEAKING" || q.type === "WRITING" || q.type === "ESSAY") {
                // AI Grading Placeholder - Will be handled below (async) or marked pending
                // Ideally we want to await this, or put it in a background job.
                // For MVP, we await it here (might be slow).
                // We'll process these after this loop to use Promise.all
            } else {
                results[q.id] = { isCorrect: false, correctAnswer: null };
            }

            if (isCorrect) {
                earnedScore += q.points;
            }
        });

        // Part 2: Process AI Grading
        const aiPromises = assignment.questions.filter(q =>
            q.type === "SPEAKING" || q.type === "WRITING" || q.type === "ESSAY"
        ).map(async (q) => {
            const userAnswer = answers[q.id];
            if (!userAnswer) return;

            let parsedContent;
            try { parsedContent = JSON.parse(q.content); } catch { parsedContent = { text: q.content }; }

            const rubric = parsedContent.aiRubric || "";
            const sectionTitle = parsedContent.sectionTitle || "";
            const contextPassage = sectionPassageMap.get(sectionTitle) || "";

            // Only grade if we have an answer
            if (userAnswer) {
                const { gradeSubmission } = await import("@/lib/ai-grading");
                const aiResult = await gradeSubmission(
                    q.type,
                    parsedContent.text,
                    userAnswer,
                    rubric,
                    q.points,
                    contextPassage
                );

                earnedScore += aiResult.score;
                // Store feedback - where? 
                // We will add it to a results map that we save in Submission.feedback (Stringified JSON)
                if (!results[q.id]) results[q.id] = { isCorrect: false, correctAnswer: null };

                // Add extended info to results
                // Type assertion hack for flexible object
                (results[q.id] as any).feedback = aiResult.feedback;
                (results[q.id] as any).score = aiResult.score;
                (results[q.id] as any).isCorrect = aiResult.score >= (q.points / 2); // Roughly pass if >= 50%
            }
        });

        await Promise.all(aiPromises);

        // Get or create assignment progress
        let progress = existingProgress;

        if (!progress) {
            progress = await prisma.assignmentProgress.create({
                data: {
                    userId: session.user.id,
                    assignment: {
                        connect: { id: assignmentId }
                    },
                    status: "IN_PROGRESS"
                },
                include: {
                    assignment: true,
                    submissions: true
                }
            });
        }

        // Check assignment type to determine status
        const newStatus = "COMPLETED";

        // Create submission with attemptNumber
        const submission = await prisma.submission.create({
            data: {
                userId: session.user.id,
                assignmentProgressId: progress.id,
                attemptNumber: nextAttemptNumber,  // Track which attempt this is
                answers: JSON.stringify(answers),
                score: earnedScore,
                feedback: JSON.stringify(results)
            }
        });

        // Calculate BEST score across all attempts
        const allScores = [
            ...progress.submissions.map(s => s.score || 0),
            earnedScore  // Include current submission
        ];
        const bestScore = Math.max(...allScores);

        // Update progress with BEST score (not just latest)
        await prisma.assignmentProgress.update({
            where: { id: progress.id },
            data: {
                status: newStatus,
                score: bestScore  // Save BEST score to AssignmentProgress
            }
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
