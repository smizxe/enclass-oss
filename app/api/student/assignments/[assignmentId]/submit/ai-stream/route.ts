import { NextRequest } from "next/server";
import { gradeSubmissionStream, parseScoreFeedbackFormat } from "@/lib/ai-grading";
import prisma from "@/lib/prisma";

// NOTE: We CANNOT use Edge Runtime here because @google/generative-ai SDK
// uses Node.js-only APIs (Buffer, etc.). Instead, we use maxDuration to extend timeout.
// Streaming keeps the connection alive, so even on Vercel Free (10s timeout),
// as long as we send data within 10s intervals, the connection stays open.
export const maxDuration = 60; // seconds (works on Vercel Pro; free tier still limited to 10s idle)

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
        return new Response("Missing submissionId", { status: 400 });
    }

    try {
        // 1. Fetch submission with its assignment progress -> assignment -> questions
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
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

        if (!submission) {
            return new Response("Submission not found", { status: 404 });
        }

        const questions = submission.assignmentProgress.assignment.questions;

        // Parse feedback and answers from JSON strings
        let results: Record<string, any> = {};
        try {
            results = typeof submission.feedback === 'string'
                ? JSON.parse(submission.feedback || "{}")
                : {};
        } catch {
            results = {};
        }

        let answers: Record<string, any> = {};
        try {
            answers = typeof submission.answers === 'string'
                ? JSON.parse(submission.answers || "{}")
                : {};
        } catch {
            answers = {};
        }

        const pendingQuestions = questions.filter((q) => results[q.id]?.isPendingAi);

        if (pendingQuestions.length === 0) {
            return new Response(JSON.stringify({ status: 'No pending AI questions' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const encoder = new TextEncoder();
        let totalScoreAddition = 0;

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for (const q of pendingQuestions) {
                        const userAnswer = answers[q.id];
                        if (!userAnswer) continue;

                        let parsedContent: any;
                        try { parsedContent = JSON.parse(q.content); } catch { parsedContent = { text: q.content }; }

                        const rubric = parsedContent.aiRubric || "";
                        const questionText = parsedContent.text || "";

                        // Get context passage if available
                        const contextPassage = parsedContent.passage || undefined;

                        const aiStream = gradeSubmissionStream(
                            q.type,
                            questionText,
                            userAnswer,
                            rubric,
                            q.points,
                            contextPassage
                        );

                        let fullText = "";
                        let isFeedbackStarted = false;

                        // Stream each chunk to the client
                        for await (const chunk of aiStream) {
                            fullText += chunk;

                            if (!isFeedbackStarted) {
                                // Look for the start of feedback to begin streaming to client
                                const feedbackMatch = fullText.match(/FEEDBACK\s*:/i);
                                if (feedbackMatch) {
                                    isFeedbackStarted = true;
                                    // Extract everything generated AFTER the FEEDBACK: keyword
                                    const idx = feedbackMatch.index! + feedbackMatch[0].length;
                                    const newContent = fullText.substring(idx).trimStart();
                                    if (newContent) {
                                        const eventData = JSON.stringify({ questionId: q.id, chunk: newContent, type: "streaming" });
                                        controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
                                    }
                                }
                            } else {
                                // Feedback has started, send chunks directly
                                const eventData = JSON.stringify({ questionId: q.id, chunk, type: "streaming" });
                                controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
                            }
                        }

                        // Parse final score from fullText
                        const finalResult = parseScoreFeedbackFormat(fullText, q.points);
                        totalScoreAddition += finalResult.score;

                        // Update results object
                        results[q.id] = {
                            isCorrect: finalResult.score >= (q.points / 2),
                            score: finalResult.score,
                            feedback: finalResult.feedback,
                            isPendingAi: false
                        };

                        // Send completion event for this question
                        const completeData = JSON.stringify({
                            questionId: q.id,
                            score: finalResult.score,
                            feedback: finalResult.feedback,
                            type: "complete"
                        });
                        controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
                    }

                    // Done with all questions, update DB via Prisma
                    const currentScore = submission.score || 0;
                    const newScore = currentScore + totalScoreAddition;

                    await prisma.submission.update({
                        where: { id: submissionId },
                        data: {
                            feedback: JSON.stringify(results),
                            score: newScore
                        }
                    });

                    // Also update AssignmentProgress best score
                    const allSubmissions = await prisma.submission.findMany({
                        where: { assignmentProgressId: submission.assignmentProgressId },
                        select: { score: true }
                    });
                    const bestScore = Math.max(...allSubmissions.map(s => s.score || 0), newScore);
                    await prisma.assignmentProgress.update({
                        where: { id: submission.assignmentProgressId },
                        data: { score: bestScore }
                    });

                    // Send done event
                    const doneData = JSON.stringify({ type: "done", finalScore: newScore });
                    controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
                    controller.close();
                } catch (e: any) {
                    console.error("Stream error", e);
                    const errorData = JSON.stringify({ type: "error", message: e.message });
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });

    } catch (e: any) {
        console.error("AI Stream endpoint error:", e);
        return new Response(e.message, { status: 500 });
    }
}
