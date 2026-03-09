import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

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
        const { answers, optionMappings, isTestMode } = body;

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

        // Get settings from assignment
        const settings = assignment.settings as { maxAttempts?: number; passPercent?: number; prerequisiteAssignmentId?: string } | null;
        const maxAttempts = settings?.maxAttempts || 1;

        // Check prerequisite assignment
        const prereqId = settings?.prerequisiteAssignmentId;
        if (prereqId) {
            const prereqProgress = await prisma.assignmentProgress.findUnique({
                where: { userId_assignmentId: { userId: session.user.id, assignmentId: prereqId } }
            });
            if (!prereqProgress || prereqProgress.status !== "COMPLETED") {
                return new NextResponse("Bạn phải hoàn thành bài tập trước đó.", { status: 403 });
            }
        }

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

        let scoredManually = false; // For multi-gap, scoring is handled inline

        assignment.questions.forEach(q => {
            if (q.type === "SECTION_HEADER") return; // Skip headers from scoring calculations

            totalScore += q.points;
            const userAnswer = answers[q.id];
            let isCorrect = false;
            scoredManually = false;

            // Manual parsing of content
            let parsedContent;
            try {
                parsedContent = JSON.parse(q.content);
            } catch {
                parsedContent = { text: q.content };
            }

            if (q.type === "MCQ") {
                // Test Mode: Decode shuffled answer back to original
                let effectiveUserAnswer = userAnswer;

                if (isTestMode && optionMappings && optionMappings[q.id]) {
                    const shuffledOptions = parsedContent.options;
                    const selectedShuffledIndex = shuffledOptions?.findIndex((opt: string) => opt === userAnswer);

                    if (selectedShuffledIndex !== undefined && selectedShuffledIndex >= 0 && optionMappings[q.id][selectedShuffledIndex] !== undefined) {
                        const originalIndex = optionMappings[q.id][selectedShuffledIndex];
                        effectiveUserAnswer = String.fromCharCode(65 + originalIndex);
                    }
                }

                // Robust checking for MCQ
                // 1. Direct match (Letter == Letter)
                isCorrect = false;
                const correctAnswerRaw = q.correctAnswer || "";
                const correctAnswersList = correctAnswerRaw.split(",").map(s => s.trim());

                // Helper to strip HTML and normalize
                const normalizeText = (s: string) => (s || "").replace(/<[^>]*>/g, "").trim().toLowerCase();
                const normalizedUserAnswer = normalizeText(effectiveUserAnswer);

                // Is the correct answer stored entirely as letters (e.g. "A" or "A,C")?
                const isLetterBased = correctAnswersList.every((a: string) => /^[A-E]$/.test(a));

                if (isLetterBased && correctAnswersList.includes(effectiveUserAnswer)) {
                    isCorrect = true;
                } else if (!isLetterBased && correctAnswersList.some(ca => normalizeText(ca) === normalizedUserAnswer)) {
                    // Correct answer is stored as text (e.g. "litter"), and user selected "litter"
                    isCorrect = true;
                } else if (parsedContent.options && Array.isArray(parsedContent.options)) {
                    // Fallback to options array indexing
                    // Case A: Correct answer is "A", user selected "litter". We check if options[0] is "litter"
                    if (isLetterBased) {
                        const matchingLetters = correctAnswersList.filter(letter => {
                            const correctIndex = letter.charCodeAt(0) - 65;
                            if (correctIndex >= 0 && correctIndex < parsedContent.options.length) {
                                const correctOptionText = parsedContent.options[correctIndex];
                                return normalizeText(correctOptionText) === normalizedUserAnswer;
                            }
                            return false;
                        });
                        if (matchingLetters.length > 0) isCorrect = true;
                    }
                    // Case B: Correct answer is "litter", user selected "A". We check if options[0] is "litter"
                    else {
                        if (/^[A-E]$/.test(effectiveUserAnswer)) {
                            const userIndex = effectiveUserAnswer.charCodeAt(0) - 65;
                            if (userIndex >= 0 && userIndex < parsedContent.options.length) {
                                const userOptionText = parsedContent.options[userIndex];
                                if (correctAnswersList.some(ca => normalizeText(ca) === normalizeText(userOptionText))) {
                                    isCorrect = true;
                                }
                            }
                        }
                    }

                    // Fallback: finding the index of the selected option
                    if (!isCorrect) {
                        const selectedIndex = parsedContent.options.findIndex((opt: string) =>
                            normalizeText(opt) === normalizedUserAnswer
                        );
                        if (selectedIndex >= 0) {
                            const selectedLetter = String.fromCharCode(65 + selectedIndex);
                            if (correctAnswersList.includes(selectedLetter)) {
                                isCorrect = true;
                            } else {
                                // AI Numeric output fallback (e.g. AI returned "4" and user selected option D, which is index 3)
                                const numericAnswers = correctAnswersList.filter(ca => !isNaN(parseInt(ca)));
                                if (numericAnswers.includes((selectedIndex + 1).toString())) {
                                    isCorrect = true;
                                }
                            }
                        }
                    }
                }

                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            } else if (q.type === "ORDERING" || q.type === "SORTABLE") {
                // For ordering/sortable, handle both string and array formats
                let formattedUserAnswer = '';
                if (Array.isArray(userAnswer)) {
                    formattedUserAnswer = userAnswer.join(',');
                } else if (typeof userAnswer === 'string') {
                    formattedUserAnswer = userAnswer;
                }

                let formattedCorrectAnswer = q.correctAnswer;
                if (formattedCorrectAnswer.startsWith('[') && formattedCorrectAnswer.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(formattedCorrectAnswer);
                        if (Array.isArray(parsed)) formattedCorrectAnswer = parsed.join(',');
                    } catch { }
                }

                if (formattedUserAnswer === formattedCorrectAnswer) {
                    isCorrect = true;
                }
                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            } else if ([
                "GAP_FILL",
                "LISTENING_NOTE_COMPLETION", "READING_NOTE_COMPLETION",
                "LISTENING_SUMMARY_COMPLETION", "READING_SUMMARY_COMPLETION",
                "LISTENING_TABLE_COMPLETION", "READING_TABLE_COMPLETION",
                "LISTENING_SENTENCE_COMPLETION", "READING_SENTENCE_COMPLETION",
                "LISTENING_DIAGRAM_COMPLETION", "READING_DIAGRAM_COMPLETION",
                "LISTENING_FLOWCHART_COMPLETION", "READING_FLOWCHART_COMPLETION",
                "LISTENING_SHORT_ANSWER", "READING_SHORT_ANSWER",
                "SENTENCE_COMPLETION" // Merged here for unified robustness
            ].includes(q.type)) {
                // Robust normalizer for gap fill text
                const normalizeGap = (s: any) => {
                    let textToProcess = s;
                    if (typeof textToProcess === 'object' && textToProcess !== null && !Array.isArray(textToProcess)) {
                        // Extract first value from dictionary if frontend sends it as `{ "0": "answer" }`
                        const values = Object.values(textToProcess);
                        textToProcess = values.length > 0 ? String(values[0]) : "";
                    }
                    if (typeof textToProcess !== 'string') return "";
                    return textToProcess
                        .replace(/<[^>]*>/g, "") // Strip HTML if accidentally saved with it
                        .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width spaces
                        .trim()
                        .toLowerCase();
                };

                // Multi-gap partial credit support
                const rawCorrectParts = q.correctAnswer.split("|");

                if (typeof userAnswer === 'object' && !Array.isArray(userAnswer) && rawCorrectParts.length > 1) {
                    // Multi-gap (one question ID mapping to multiple sub-gaps)
                    let correctCount = 0;
                    const perGapResults: { isCorrect: boolean; correctAnswer: string }[] = [];

                    rawCorrectParts.forEach((correctRaw, i) => {
                        const userGap = normalizeGap(userAnswer[i]);
                        const acceptableAnswers = correctRaw.split("/").map(normalizeGap);
                        const gapCorrect = acceptableAnswers.includes(userGap);

                        if (gapCorrect) correctCount++;
                        perGapResults.push({
                            isCorrect: gapCorrect,
                            correctAnswer: correctRaw.trim()
                        });
                    });

                    const gapScore = Math.round((correctCount / rawCorrectParts.length) * q.points);
                    earnedScore += gapScore;
                    isCorrect = correctCount === rawCorrectParts.length;
                    scoredManually = true;

                    results[q.id] = {
                        isCorrect,
                        correctAnswer: q.correctAnswer,
                        perGapResults,
                        score: gapScore
                    } as any;
                } else {
                    // Single gap
                    const userTyped = normalizeGap(userAnswer);

                    // Allow splitting by "/" for alternate answers. 
                    // We only look at `rawCorrectParts[0]` if it was accidentally saved with a `|`, 
                    // but typically for standard single gaps it's just the whole string.
                    const textToMatch = rawCorrectParts.length > 0 ? rawCorrectParts[0] : q.correctAnswer;
                    const acceptableAnswers = textToMatch.split("/").map(normalizeGap);

                    if (acceptableAnswers.includes(userTyped)) {
                        isCorrect = true;
                    }
                    results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
                }
            } else if (
                q.type === "TRUE_FALSE_NOT_GIVEN" ||
                q.type === "YES_NO_NOT_GIVEN" ||
                q.type === "MATCHING_INFORMATION" ||
                q.type === "MATCHING_NAMES"
            ) {
                // IELTS-style types: simple case-insensitive string comparison
                let userStr = typeof userAnswer === 'string' ? userAnswer.trim().toUpperCase() : '';
                let correctStr = q.correctAnswer.trim().toUpperCase();

                // Normalise CSV spaces to prevent multi-select mismatch (e.g., "A, C" vs "A,C")
                userStr = userStr.replace(/\s*,\s*/g, ',');
                correctStr = correctStr.replace(/\s*,\s*/g, ',');

                if (userStr === correctStr) {
                    isCorrect = true;
                }
                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            } else if (q.type === "SPEAKING" || q.type === "WRITING" || q.type === "ESSAY") {
                // AI Grading - handled in Part 2 below via Promise.all
            } else {
                // Unknown type fallback - try simple string comparison with robust normalizer
                const normalizeFallback = (s: any) => typeof s === 'string' ? s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim().toUpperCase() : '';
                const userStr = normalizeFallback(userAnswer);
                const correctStr = normalizeFallback(q.correctAnswer);
                if (userStr && correctStr && userStr === correctStr) {
                    isCorrect = true;
                }
                results[q.id] = { isCorrect, correctAnswer: q.correctAnswer };
            }

            if (isCorrect && !scoredManually) {
                earnedScore += q.points;
            }
        });

        // Part 2: Process AI Grading
        // PHASE 1: WE DONT CALL AI HERE ANYMORE
        // We just record which questions need AI grading so the client can trigger Phase 2 streaming
        const pendingAiQuestionIds: string[] = [];

        assignment.questions.filter(q =>
            q.type === "SPEAKING" || q.type === "WRITING" || q.type === "ESSAY"
        ).forEach((q) => {
            const userAnswer = answers[q.id];
            if (!userAnswer) return; // Skip if student didn't answer

            pendingAiQuestionIds.push(q.id);

            // Mark as pending in the results object
            results[q.id] = {
                isCorrect: false,
                correctAnswer: null,
                isPendingAi: true, // Flag for the frontend
                score: 0,
                feedback: "Đang chờ chấm điểm..."
            } as any;
        });

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
        // If passPercent is set, check if score meets the threshold
        const passPercent = settings?.passPercent;
        const hasPendingAi = pendingAiQuestionIds.length > 0;
        let newStatus: string;
        if (hasPendingAi) {
            // If there are AI questions pending, temporarily set as COMPLETED
            // The final pass/fail check will be done after AI grading in ai-stream route
            newStatus = passPercent ? "IN_PROGRESS" : "COMPLETED";
        } else {
            // All questions are auto-graded, check pass percentage now
            if (passPercent && totalScore > 0) {
                const scorePercent = (earnedScore / totalScore) * 100;
                newStatus = scorePercent >= passPercent ? "COMPLETED" : "NOT_PASSED";
            } else {
                newStatus = "COMPLETED";
            }
        }

        // Convert raw earnedScore into 10-point scale rounded to 0.25
        const rawScore10 = totalScore > 0 ? (earnedScore / totalScore) * 10 : 0;
        const scaledScore = Math.round(rawScore10 * 4) / 4;

        // Create submission with attemptNumber
        const submission = await prisma.submission.create({
            data: {
                userId: session.user.id,
                assignmentProgressId: progress.id,
                attemptNumber: nextAttemptNumber,  // Track which attempt this is
                answers: JSON.stringify(answers),
                score: scaledScore, // Use scaled score
                feedback: JSON.stringify(results)
            }
        });

        // Calculate BEST score across all attempts (now all are on 10-point scale)
        const allScores = [
            ...progress.submissions.map(s => s.score || 0),
            scaledScore  // Include current scaled score
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

        revalidateTag(`student-dashboard:${session.user.id}`, "max");
        revalidateTag(`student-classes:${session.user.id}`, "max");
        revalidateTag(`student-progress:${session.user.id}`, "max");

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            status: newStatus,
            score: scaledScore, // Return 10-point scale
            totalScore: 10,     // Total is always 10
            rawEarnedScore: earnedScore, // Keep raw available just in case
            rawTotalScore: totalScore,
            results: results,
            pendingAiQuestionIds: pendingAiQuestionIds
        });
    } catch (error) {
        console.error("[SUBMIT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
