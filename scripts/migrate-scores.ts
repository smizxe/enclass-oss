/**
 * Script to migrate legacy scores to the new 10-point scale.
 * Run with: npx ts-node scripts/migrate-scores.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Safe JSON parse
function safeParseJSON(jsonString: string | null | undefined, fallback: unknown = null) {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch {
        return fallback;
    }
}

// Helper: Extract per-question AI feedback
function getQuestionAIFeedback(feedback: string | null, questionId: string): {
    isCorrect?: boolean;
    correctAnswer?: string;
} | null {
    if (!feedback) return null;
    const parsed = safeParseJSON(feedback);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed[questionId]) {
        return {
            isCorrect: parsed[questionId].isCorrect,
            correctAnswer: parsed[questionId].correctAnswer
        };
    }
    return null;
}

async function main() {
    console.log("Fetching submissions with scores > 10...");

    // Find all submissions where score is greater than 10 or needs recalculation
    const submissions = await prisma.submission.findMany({
        where: {
            score: {
                gt: 10
            }
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

    console.log(`Found ${submissions.length} submissions to migrate.`);

    let updatedCount = 0;

    for (const sub of submissions) {
        try {
            const questions = sub.assignmentProgress.assignment.questions || [];
            const answers = safeParseJSON(sub.answers, {}) as Record<string, unknown>;

            let correct = 0;
            let total = questions.length;

            questions.forEach((q: any) => {
                const ans = answers[q.id];
                const qFeedback = getQuestionAIFeedback(sub.feedback, q.id);

                let isCorrect = false;
                if (qFeedback && typeof qFeedback.isCorrect === 'boolean') {
                    isCorrect = qFeedback.isCorrect;
                } else if (ans !== undefined && ans !== null && q.correctAnswer) {
                    if (String(ans) === String(q.correctAnswer)) {
                        isCorrect = true;
                    }
                }
                if (isCorrect) correct++;
            });

            const rawScore = total > 0 ? (correct / total) * 10 : 0;
            const autoScore = Math.round(rawScore * 4) / 4;

            // Update submission
            await prisma.submission.update({
                where: { id: sub.id },
                data: { score: autoScore }
            });

            // Update associated assignment progress if it matches
            if (sub.assignmentProgressId) {
                const progress = await prisma.assignmentProgress.findUnique({
                    where: { id: sub.assignmentProgressId }
                });

                if (progress && progress.score === sub.score) { // update only if it was matching the legacy score
                    await prisma.assignmentProgress.update({
                        where: { id: sub.assignmentProgressId },
                        data: { score: autoScore }
                    });
                } else if (progress && progress.score !== null && progress.score > 10) {
                    // Force update if progress score is also legacy
                    await prisma.assignmentProgress.update({
                        where: { id: sub.assignmentProgressId },
                        data: { score: autoScore }
                    });
                }
            }

            // Also check memory logic if score was saved as integer and we want to enforce new scale
            updatedCount++;
            if (updatedCount % 10 === 0) {
                console.log(`Processed ${updatedCount}/${submissions.length}`);
            }

        } catch (e) {
            console.error(`Error processing submission ${sub.id}`, e);
        }
    }

    // Force run a second sweep for any remaining AssignmentProgress with > 10
    const legacyProgress = await prisma.assignmentProgress.findMany({
        where: { score: { gt: 10 } }
    });

    for (const prog of legacyProgress) {
        const rawScore = (prog.score! / 100) * 10;
        const autoScore = Math.round(rawScore * 4) / 4;
        await prisma.assignmentProgress.update({
            where: { id: prog.id },
            data: { score: autoScore }
        });
        updatedCount++;
    }

    console.log(`Migration completed. Updated total ${updatedCount} records.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
