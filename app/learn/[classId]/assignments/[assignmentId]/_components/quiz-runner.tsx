"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, Send, Loader2, BookOpen, ChevronRight, ChevronLeft, RefreshCw, History, ClipboardList, FileText, Clock, Maximize, Minimize } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { ResizableSplitPane } from "@/components/ui/resizable-split-pane";
import { AssignmentResult } from "./assignment-result";

import { McqQuestion } from "@/components/questions/mcq-question";
import { GapFillQuestion } from "@/components/questions/gap-fill-question";
import { SortableQuestion } from "@/components/questions/sortable-question";
import { EssayQuestion } from "@/components/questions/essay-question";
import { SpeakingQuestion } from "@/components/questions/speaking-question";
import { StickyAudioPlayer } from "@/components/sticky-audio-player";
import { PassageViewer } from "./passage-viewer";
import { CompactGapFillSection } from "@/components/questions/compact-gap-fill-section";

/** Strip duplicate (N) markers next to {N} and normalize [N] to {N} — legacy data cleanup */
function cleanPassageMarkers(text: string): string {
    let cleaned = text.replace(/\((\d+)\)\s*\{(\1)\}/g, '{$2}');
    cleaned = cleaned.replace(/(\d+)\.\s*\{(\1)\}/g, '{$2}');
    // "[19]" → "{19}" (normalize square brackets to curly braces)
    cleaned = cleaned.replace(/\[(\d+)\]/g, '{$1}');
    return cleaned;
}

interface QuizRunnerProps {
    assignment: {
        id: string;
        title: string;
        type: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: any[];
        settings?: any;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialSubmission?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allSubmissions?: any[];
    maxAttempts?: number;
    currentAttemptCount?: number;
    isTestMode?: boolean;
    userId?: string;
    timeLimitMinutes?: number;
    deadline?: string | null;
}

interface ParsedQuestion {
    id: string;
    type: string;
    content: string;
    points: number;
    correctAnswer: string;
    explanation?: string | null;
    parsed: {
        text: string;
        items?: string[];
        options?: string[];
        passage?: string;
        passageTranslation?: string;
        sectionTitle?: string;
        sectionType?: string;
        sectionImages?: string[];
        sectionVideo?: string;
    };
}

interface QuestionGroup {
    sectionTitle: string;
    sectionType: string;
    passage?: string;
    notePassage?: string;
    passageTranslation?: string;
    passageTable?: string;
    sectionAudio?: string;
    sectionVideo?: string;
    sectionImages?: string[];
    questions: ParsedQuestion[];
}


const SectionContent = ({
    group,
    answers,
    onAnswerChange,
    showPassage = true,
    startIndex,
    submissionResult,
    passageFontSize = 16,
    questionFontSize = 16,
    showAnswersAfterSubmit = true,
}: {
    group: QuestionGroup,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onAnswerChange: any,
    showPassage?: boolean,
    startIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submissionResult?: any,
    passageFontSize?: number,
    questionFontSize?: number,
    showAnswersAfterSubmit?: boolean
}) => {
    return (
        <div className="space-y-8 pb-10">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="px-3">{group.sectionTitle}</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                {/* Section Audio (If exists) */}
                {group.sectionAudio && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <span className="text-xl">🎧</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Audio phần này</div>
                            <audio
                                controls
                                src={group.sectionAudio}
                                className="w-full h-8"
                                controlsList="nodownload"
                            />
                        </div>
                    </div>
                )}

                {/* Compact GAP_FILL Mode: Inline inputs in passage */}
                {/* Render questions: group contiguous GAP_FILL runs for compact display, standard cards for others */}
                {(() => {
                    // Helper: check if a question is GAP_FILL type (permissive)


                    // Filter out SECTION_HEADER questions
                    const realQuestions = group.questions.filter(q => q.type !== "SECTION_HEADER");

                    // Group contiguous questions by render mode (gap_fill vs standard)
                    type QuestionRun = {
                        mode: "gap_fill" | "standard";
                        questions: ParsedQuestion[];
                        startIdx: number; // index relative to section start
                    };

                    const runs: QuestionRun[] = [];
                    let currentRun: QuestionRun | null = null;

                    realQuestions.forEach((q, idx) => {
                        const type = (q.type || "").toUpperCase();
                        const mode = type.includes("GAP") && (group.notePassage || group.passage) ? "gap_fill" : "standard";
                        if (!currentRun || currentRun.mode !== mode) {
                            currentRun = { mode, questions: [], startIdx: idx };
                            runs.push(currentRun);
                        }
                        currentRun.questions.push(q);
                    });

                    // Track question counter across runs
                    let runCounter = startIndex;

                    return (
                        <>
                            {/* Passage (Only if showPassage is true AND we're NOT in all-compact mode) */}
                            {showPassage && group.passage && (
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-4">
                                        <BookOpen className="w-4 h-4" />
                                        <span>Đọc đoạn văn sau:</span>
                                    </div>

                                    {/* Render HTML/Markdown from Editor */}
                                    <div className="text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-slate-100 prose prose-sm max-w-none [&_strong]:font-bold [&_em]:italic [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2"
                                        style={{ fontSize: `${passageFontSize}px` }}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                            rehypePlugins={[rehypeRaw]}
                                        >
                                            {(cleanPassageMarkers(group.passage || "")).replace(/\\n/g, '\n')}
                                        </ReactMarkdown>
                                    </div>

                                    {group.passageTranslation && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <div className="text-xs font-medium text-slate-500 mb-2">📖 Tạm dịch:</div>
                                            <div className="text-slate-600 italic leading-relaxed" style={{ fontSize: `${passageFontSize}px` }}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                                    rehypePlugins={[rehypeRaw]}
                                                >
                                                    {(group.passageTranslation || "").replace(/\\n/g, '\n')}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Render each contiguous run */}
                            {runs.map((run, runIdx) => {
                                const runStart = runCounter;
                                runCounter += run.questions.length;

                                if (run.mode === "gap_fill" && (group.passage || group.passageTable)) {
                                    // For GAP_FILL: use passageTable if available, then notePassage (note structure with {N}),
                                    // otherwise fall back to passage (backward compat for old imports)
                                    const gapFillPassage = group.passageTable || group.notePassage || group.passage || "";
                                    return (
                                        <div key={`run-${runIdx}`}>
                                            <CompactGapFillSection
                                                passage={gapFillPassage}
                                                questions={run.questions}
                                                answers={answers}
                                                onAnswerChange={onAnswerChange}
                                                disabled={!!submissionResult}
                                                results={submissionResult?.results}
                                                startIndex={runStart}
                                                fontSize={questionFontSize}
                                                showAnswersAfterSubmit={showAnswersAfterSubmit}
                                            />
                                        </div>
                                    );
                                }

                                // Standard card layout for MCQ/other questions
                                return (
                                    <div key={`run-${runIdx}`} className="space-y-4" style={{ fontSize: `${questionFontSize}px` }}>
                                        {run.questions.map((q, qIdx) => {
                                            const currentIndex = runStart + qIdx;
                                            const result = submissionResult?.results?.[q.id];
                                            let statusColor = "border-slate-200";
                                            let statusBg = "bg-white";

                                            if (result) {
                                                if (result.isCorrect) {
                                                    statusColor = "border-emerald-200";
                                                    statusBg = "bg-emerald-50/30";
                                                } else {
                                                    statusColor = "border-red-200";
                                                    statusBg = "bg-red-50/30";
                                                }
                                            } else if (answers[q.id]) {
                                                statusColor = "border-emerald-200";
                                            }

                                            return (
                                                <div
                                                    key={q.id}
                                                    className={`rounded-xl border shadow-sm overflow-hidden transition ${statusColor} ${statusBg}`}
                                                >
                                                    {/* Question Header */}
                                                    <div className={`px-5 py-3 flex items-center justify-between border-b ${result
                                                        ? (result.isCorrect ? "bg-emerald-100 border-emerald-200" : "bg-red-50 border-red-100")
                                                        : (answers[q.id] ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")
                                                        }`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${result
                                                                ? (result.isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white")
                                                                : (answers[q.id] ? "bg-emerald-500 text-white" : "bg-white text-slate-600 border border-slate-200")
                                                                }`}>
                                                                {result ? (result.isCorrect ? <CheckCircle className="w-4 h-4" /> : <span className="font-bold">✕</span>) : (answers[q.id] ? <CheckCircle className="w-4 h-4" /> : currentIndex + 1)}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700">
                                                                Câu {currentIndex + 1}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
                                                            {q.points} điểm
                                                        </span>
                                                    </div>

                                                    {/* Question Content */}
                                                    <div className="p-5">
                                                        {q.type === "MCQ" && (
                                                            <McqQuestionSimple
                                                                question={q}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                value={answers[q.id] as string}
                                                                onChange={(val) => onAnswerChange(q.id, val)}
                                                                result={result}
                                                                isMultiSelect={!!(q.correctAnswer && q.correctAnswer.includes(","))}
                                                                showAnswersAfterSubmit={showAnswersAfterSubmit}
                                                            />
                                                        )}
                                                        {q.type === "GAP_FILL" && (
                                                            <GapFillQuestion
                                                                question={q}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                value={answers[q.id] as Record<number, string> | string}
                                                                onChange={(val) => onAnswerChange(q.id, val)}
                                                                disabled={!!result}
                                                                result={result}
                                                                showAnswersAfterSubmit={showAnswersAfterSubmit}
                                                            />
                                                        )}
                                                        {q.type === "SORTABLE" && (
                                                            <SortableQuestion
                                                                question={q}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                value={answers[q.id] as string[]}
                                                                onChange={(val) => onAnswerChange(q.id, val)}
                                                            />
                                                        )}
                                                        {(q.type === "ESSAY" || q.type === "WRITING") && (
                                                            <EssayQuestion
                                                                question={q}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                value={answers[q.id] as string}
                                                                onChange={(val) => onAnswerChange(q.id, val)}
                                                            />
                                                        )}
                                                        {q.type === "SPEAKING" && (
                                                            <SpeakingQuestion
                                                                question={q}
                                                                value={answers[q.id] as string}
                                                                onChange={(val) => onAnswerChange(q.id, val)}
                                                            />
                                                        )}
                                                        {q.type === "ORDERING" && (
                                                            <McqQuestionSimple
                                                                question={q}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                value={answers[q.id] as string}
                                                                onChange={(val) => onAnswerChange(q.id, val)}
                                                                result={result}
                                                            />
                                                        )}
                                                        {!["MCQ", "GAP_FILL", "SORTABLE", "ESSAY", "ORDERING", "SPEAKING", "WRITING"].includes(q.type) && (
                                                            <McqQuestionSimple
                                                                question={q}
                                                                value={answers[q.id] as string}
                                                                onChange={(val) => onAnswerChange(q.id, val)}
                                                                result={result}
                                                                isMultiSelect={!!(q.correctAnswer && q.correctAnswer.includes(","))}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

// ====== SHUFFLE UTILITIES FOR TEST MODE ======

// Simple seeded random number generator (Mulberry32)
function seedRandom(seed: number) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Hash string to number for deterministic seeding
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Shuffle array with seed and return both shuffled array and mapping
function shuffleWithMapping<T>(array: T[], seed: number): { shuffled: T[], mapping: number[] } {
    const result = [...array];
    const mapping = array.map((_, i) => i); // Track original indices
    const random = seedRandom(seed);
    let m = result.length;

    while (m) {
        const i = Math.floor(random() * m--);
        // Swap elements
        [result[m], result[i]] = [result[i], result[m]];
        [mapping[m], mapping[i]] = [mapping[i], mapping[m]];
    }

    return { shuffled: result, mapping };
}

// ====== END SHUFFLE UTILITIES ======

export const QuizRunner = ({
    assignment,
    initialSubmission,
    allSubmissions = [],
    maxAttempts = 1,
    currentAttemptCount = 0,
    isTestMode = false,
    userId = "",
    timeLimitMinutes = 0,
    deadline = null
}: QuizRunnerProps) => {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [submissionResult, setSubmissionResult] = useState<any>(null);
    const [streamingFeedback, setStreamingFeedback] = useState<Record<string, { text: string; isStreaming: boolean; score?: number; isError?: boolean; errorMessage?: string }>>({});
    const [viewingAttempt, setViewingAttempt] = useState<number | null>(null); // null = latest/current
    const [isStartingNewAttempt, setIsStartingNewAttempt] = useState(false);
    const [passageFontSize, setPassageFontSize] = useState(16);
    const [questionFontSize, setQuestionFontSize] = useState(16);
    const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
    const appearanceRef = useRef<HTMLDivElement>(null);
    const quizContainerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            quizContainerRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Option mappings for Test Mode (questionId -> original indices array)
    const [optionMappings, setOptionMappings] = useState<Record<string, number[]>>({});

    // ====== TIMER & DEADLINE STATE ======
    const timerKey = `timer_${assignment.id}_${userId}`;
    const hasTimeLimit = timeLimitMinutes > 0;
    const [showTimerWarning, setShowTimerWarning] = useState(false); // Popup cảnh báo
    const [timerStarted, setTimerStarted] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60); // seconds
    const autoSubmitRef = useRef(false); // Prevent double auto-submit

    // Check deadline expiry
    const isDeadlineExpired = deadline ? new Date(deadline) < new Date() : false;
    const deadlineDate = deadline ? new Date(deadline) : null;

    // Format time remaining as HH:MM:SS
    const formatTime = useCallback((seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, []);

    const startAiStream = useCallback((submissionId: string, assignmentId: string) => {
        // Initialize streaming state
        setStreamingFeedback({});

        const eventSource = new EventSource(`/api/student/assignments/${assignmentId}/submit/ai-stream?submissionId=${submissionId}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "streaming") {
                    setStreamingFeedback(prev => ({
                        ...prev,
                        [data.questionId]: {
                            text: (prev[data.questionId]?.text || "") + data.chunk,
                            isStreaming: true
                        }
                    }));
                } else if (data.type === "complete") {
                    setStreamingFeedback(prev => ({
                        ...prev,
                        [data.questionId]: {
                            ...prev[data.questionId],
                            isStreaming: false,
                            score: data.score
                        }
                    }));

                    // Update submission result locally
                    setSubmissionResult((prev: any) => {
                        if (!prev) return prev;
                        const newResults = { ...prev.results };
                        if (newResults[data.questionId]) {
                            newResults[data.questionId] = {
                                ...newResults[data.questionId],
                                isPendingAi: false,
                                score: data.score,
                                feedback: data.feedback,
                                isCorrect: data.score >= (assignment.questions.find(q => q.id === data.questionId)?.points || 0) / 2
                            };
                        }
                        return { ...prev, results: newResults };
                    });
                } else if (data.type === "done") {
                    // Update final score
                    setSubmissionResult((prev: any) => ({
                        ...prev,
                        score: data.finalScore
                    }));
                    eventSource.close();
                } else if (data.type === "error") {
                    console.error("AI Stream error:", data.message);
                    setStreamingFeedback(prev => {
                        const newState = { ...prev };
                        // If we have a specific question ID, mark just that one
                        if (data.questionId) {
                            newState[data.questionId] = {
                                ...newState[data.questionId],
                                isStreaming: false,
                                isError: true,
                                errorMessage: data.message
                            };
                        } else {
                            // Otherwise, mark all currently streaming items as errored
                            Object.keys(newState).forEach(qId => {
                                if (newState[qId].isStreaming) {
                                    newState[qId] = {
                                        ...newState[qId],
                                        isStreaming: false,
                                        isError: true,
                                        errorMessage: data.message
                                    };
                                }
                            });
                        }
                        return newState;
                    });
                    eventSource.close();
                }
            } catch (e) {
                console.error("Failed to parse SSE message", e);
            }
        };

        eventSource.onerror = (error) => {
            console.error("EventSource failed:", error);
            setStreamingFeedback(prev => {
                const newState = { ...prev };
                Object.keys(newState).forEach(qId => {
                    if (newState[qId].isStreaming) {
                        newState[qId] = {
                            ...newState[qId],
                            isStreaming: false,
                            isError: true,
                            errorMessage: "Lỗi kết nối máy chủ"
                        };
                    }
                });
                return newState;
            });
            eventSource.close();
        };
    }, [assignment.questions]);

    const retryAiGrading = useCallback(() => {
        if (submissionResult?.submissionId) {
            // Revert all errored items back to streaming state to show loader
            setStreamingFeedback(prev => {
                const newState = { ...prev };
                Object.keys(newState).forEach(qId => {
                    if (newState[qId].isError) {
                        newState[qId] = {
                            ...newState[qId],
                            isError: false,
                            errorMessage: undefined
                        };
                    }
                });
                return newState;
            });
            startAiStream(submissionResult.submissionId, assignment.id);
        }
    }, [submissionResult, assignment.id, startAiStream]);

    // Auto-submit when timer expires
    const handleAutoSubmit = useCallback(async () => {
        if (autoSubmitRef.current || isSubmitted) return;
        autoSubmitRef.current = true;
        toast.error("⏰ Hết giờ! Bài làm đang được tự động nộp...");
        try {
            const response = await fetch(`/api/student/assignments/${assignment.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers,
                    optionMappings: isTestMode ? optionMappings : undefined,
                    isTestMode
                })
            });
            if (response.ok) {
                const result = await response.json();
                setSubmissionResult(result);
                setIsSubmitted(true);
                localStorage.removeItem(timerKey);
                toast.success(`Bài đã được tự động nộp. Điểm: ${result.score}/${result.totalScore}`);

                // PHASE 2: Start AI Streaming if there are pending questions
                if (result.pendingAiQuestionIds && result.pendingAiQuestionIds.length > 0) {
                    startAiStream(result.submissionId, assignment.id);
                }
            }
        } catch (error) {
            console.error("Auto-submit error:", error);
            toast.error("Lỗi khi tự động nộp bài");
            autoSubmitRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answers, assignment.id, isSubmitted, isTestMode, optionMappings, timerKey]);

    // Initialize timer from localStorage on mount
    useEffect(() => {
        if (!hasTimeLimit || isSubmitted || initialSubmission) return;

        const savedStartTime = localStorage.getItem(timerKey);
        if (savedStartTime) {
            // Timer was already started — resume
            const elapsed = Math.floor((Date.now() - parseInt(savedStartTime)) / 1000);
            const remaining = Math.max(0, timeLimitMinutes * 60 - elapsed);
            setTimeRemaining(remaining);
            setTimerStarted(true);
            if (remaining <= 0) {
                handleAutoSubmit();
            }
        } else {
            // Show warning popup for first-time visit
            setShowTimerWarning(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasTimeLimit, isSubmitted, initialSubmission]);

    // Countdown interval
    useEffect(() => {
        if (!timerStarted || isSubmitted) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerStarted, isSubmitted, handleAutoSubmit]);

    // Start timer (called from warning popup)
    const handleStartTimer = () => {
        localStorage.setItem(timerKey, Date.now().toString());
        setTimerStarted(true);
        setShowTimerWarning(false);
        setTimeRemaining(timeLimitMinutes * 60);
    };

    const canRetry = currentAttemptCount < maxAttempts;
    const remainingAttempts = maxAttempts - currentAttemptCount;

    // Initialize from existing submission
    useEffect(() => {
        if (initialSubmission) {
            try {
                const parsedAnswers = JSON.parse(initialSubmission.answers);
                let parsedFeedback = {};
                try {
                    parsedFeedback = initialSubmission.feedback ? JSON.parse(initialSubmission.feedback) : {};
                } catch { }

                setAnswers(parsedAnswers);
                setIsSubmitted(true);
                setSubmissionResult({
                    score: initialSubmission.score,
                    totalScore: assignment.questions.reduce((acc, q) => acc + q.points, 0),
                    results: parsedFeedback,
                    attemptNumber: initialSubmission.attemptNumber || currentAttemptCount
                });
            } catch (e) {
                console.error("Error parsing submission", e);
            }
        }
    }, [initialSubmission, assignment.questions, currentAttemptCount]);

    // Start new attempt - reset state
    const handleStartNewAttempt = () => {
        if (!canRetry) return;

        const confirmMsg = `Bạn còn ${remainingAttempts} lượt làm bài. Bắt đầu lần làm mới?`;
        if (!confirm(confirmMsg)) return;

        setIsStartingNewAttempt(true);
        // Reset state for new attempt
        setAnswers({});
        setIsSubmitted(false);
        setSubmissionResult(null);
        setViewingAttempt(null);
        setActiveSectionIndex(0);
        setIsStartingNewAttempt(false);
    };

    // View a specific past attempt
    const handleViewAttempt = (attemptIndex: number) => {
        const submission = allSubmissions[attemptIndex];
        if (!submission) return;

        try {
            const parsedAnswers = JSON.parse(submission.answers);
            let parsedFeedback = {};
            try {
                parsedFeedback = submission.feedback ? JSON.parse(submission.feedback) : {};
            } catch { }

            setViewingAttempt(attemptIndex);
            setAnswers(parsedAnswers);
            setIsSubmitted(true);
            setSubmissionResult({
                score: submission.score,
                totalScore: assignment.questions.reduce((acc, q) => acc + q.points, 0),
                results: parsedFeedback,
                attemptNumber: submission.attemptNumber || attemptIndex + 1
            });
        } catch (e) {
            console.error("Error parsing submission", e);
        }
    };

    // Parse questions and group by section, with optional shuffling for Test Mode
    const useMemoResult = useMemo(() => {
        const groups: QuestionGroup[] = [];
        let currentGroup: QuestionGroup | null = null;
        const newOptionMappings: Record<string, number[]> = {};

        // Generate deterministic seed from userId + assignmentId + attemptCount
        const shuffleSeed = isTestMode
            ? hashCode(`${userId}-${assignment.id}-${currentAttemptCount}`)
            : 0;

        for (const q of assignment.questions) {
            let parsed;
            try {
                // Try strictly first
                parsed = JSON.parse(q.content);
            } catch (e) {
                // If strict parse fails, try to sanitize common issues
                try {
                    // Replace literal newlines with escaped newlines
                    // This handles cases where content might have been saved with physical line breaks
                    const sanitized = q.content
                        .replace(/\n/g, "\\n")
                        .replace(/\r/g, "");
                    parsed = JSON.parse(sanitized);
                } catch (e2) {
                    console.error("Failed to parse question content:", q.id, e2);
                    // Fallback to treating it as plain text
                    parsed = { text: q.content, options: [] };
                }
            }

            const sectionTitle = parsed.sectionTitle || "Câu hỏi";
            const sectionType = parsed.sectionType || "STANDALONE";

            // Check if we need a new group
            if (!currentGroup || currentGroup.sectionTitle !== sectionTitle) {
                currentGroup = {
                    sectionTitle,
                    sectionType,
                    passage: parsed.passage,
                    notePassage: parsed.notePassage,
                    passageTranslation: parsed.passageTranslation,
                    passageTable: parsed.passageTable, // Support for HTML table data
                    sectionAudio: parsed.sectionAudio,
                    sectionVideo: parsed.sectionVideo,
                    sectionImages: parsed.sectionImages || [],
                    questions: []
                };
                groups.push(currentGroup);
            }

            // Fallback: update group info if missing
            if (parsed.sectionAudio && !currentGroup.sectionAudio) currentGroup.sectionAudio = parsed.sectionAudio;
            if (parsed.sectionImages && (!currentGroup.sectionImages || currentGroup.sectionImages.length === 0)) {
                currentGroup.sectionImages = parsed.sectionImages;
            }
            if (parsed.sectionVideo && !currentGroup.sectionVideo) currentGroup.sectionVideo = parsed.sectionVideo;

            // Shuffle options for MCQ in Test Mode
            let finalParsed = { ...parsed };
            if (isTestMode && q.type === "MCQ" && parsed.options && parsed.options.length > 0) {
                // Use question-specific seed for option shuffling
                const questionSeed = shuffleSeed + hashCode(q.id);
                const { shuffled, mapping } = shuffleWithMapping(parsed.options, questionSeed);
                finalParsed.options = shuffled;
                newOptionMappings[q.id] = mapping;
            }

            // Add question to current group
            currentGroup.questions.push({
                ...q,
                parsed: {
                    ...finalParsed,
                    passage: undefined,
                    passageTranslation: undefined
                }
            });
        }

        // Shuffle sections in Test Mode (Part order)
        let finalGroups = groups;
        if (isTestMode && groups.length > 1) {
            const { shuffled: shuffledSections } = shuffleWithMapping(groups, shuffleSeed);
            finalGroups = shuffledSections;
        }

        return { groups: finalGroups, newOptionMappings };
    }, [assignment.questions, assignment.id, isTestMode, userId, currentAttemptCount]);

    const { groups: groupedQuestions, newOptionMappings } = useMemoResult;

    // Update option mappings state (only on mount or when test mode changes)
    useEffect(() => {
        if (isTestMode && Object.keys(newOptionMappings).length > 0) {
            setOptionMappings(newOptionMappings);
        }
    }, [newOptionMappings, isTestMode]);


    // Calculate start index for questions in current section
    const currentSectionStartIndex = useMemo(() => {
        let count = 0;
        for (let i = 0; i < activeSectionIndex; i++) {
            count += groupedQuestions[i].questions.length;
        }
        return count;
    }, [activeSectionIndex, groupedQuestions]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAnswerChange = (questionId: string, value: any) => {
        if (isSubmitted) return; // Prevent changes after submission
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    }

    const onSubmit = async () => {
        if (!confirm("Bạn có chắc chắn muốn nộp bài?")) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/student/assignments/${assignment.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers,
                    optionMappings: isTestMode ? optionMappings : undefined,
                    isTestMode
                })
            });

            if (response.ok) {
                const result = await response.json();
                setSubmissionResult(result);
                if (result.status === "PENDING_GRADING") {
                    toast.success("Bài làm đã được nộp! Đang chờ giáo viên chấm điểm.");
                } else {
                    toast.success(`Nộp bài thành công! Điểm số: ${result.score}/${result.totalScore}`);
                }
                setIsSubmitted(true);
                // Clear timer from localStorage
                if (hasTimeLimit) localStorage.removeItem(timerKey);

                // PHASE 2: Start AI Streaming if there are pending questions
                if (result.pendingAiQuestionIds && result.pendingAiQuestionIds.length > 0) {
                    startAiStream(result.submissionId, assignment.id);
                }
            } else {
                toast.error("Có lỗi xảy ra khi nộp bài");
            }
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = assignment.questions.length;
    // Count "correct" only for auto-graded questions (exclude Speaking/Writing/Essay)
    // Actually, simpler approach: Use the result from server if available (submissionResult.score)
    // For Header display during exam, we rely on answeredCount.

    // Auto-scroll to top when section changes
    useEffect(() => {
        const splitLeft = document.getElementById('split-left');
        const splitRight = document.getElementById('split-right');
        const mobileContainer = document.getElementById('mobile-container');

        if (splitLeft) splitLeft.scrollTop = 0;
        if (splitRight) splitRight.scrollTop = 0;
        if (mobileContainer) mobileContainer.scrollTop = 0;
    }, [activeSectionIndex]);

    // Close appearance popup when clicking outside
    // IMPORTANT: This hook MUST be placed before any early return statements
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (appearanceRef.current && !appearanceRef.current.contains(event.target as Node)) {
                setIsAppearanceOpen(false);
            }
        };

        if (isAppearanceOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAppearanceOpen]);

    // ====== TIMER WARNING STATE ======
    const isTimerWarningActive = showTimerWarning && hasTimeLimit && !isSubmitted && !initialSubmission;

    if (assignment.questions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📝</span>
                </div>
                <h3 className="font-medium text-slate-900 mb-1">Chưa có câu hỏi</h3>
                <p className="text-sm text-slate-500">Bài tập này chưa có câu hỏi nào.</p>
            </div>
        );
    }

    const activeGroup = groupedQuestions[activeSectionIndex];
    const isFirstSection = activeSectionIndex === 0;
    const isLastSection = activeSectionIndex === groupedQuestions.length - 1;

    const SubmitButton = ({ className }: { className?: string }) => {
        if (isSubmitted) return null;
        if (isDeadlineExpired) {
            return (
                <div className={`bg-red-100 text-red-700 font-medium flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm ${className}`}>
                    <Clock className="w-4 h-4" />
                    Đã hết hạn nộp bài
                </div>
            );
        }

        return (
            <button
                onClick={onSubmit}
                disabled={isSubmitting || (hasTimeLimit && showTimerWarning)}
                className={`bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-200 ${className}`}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang nộp bài...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Nộp bài
                    </>
                )}
            </button>
        );
    }

    const NavigationControls = () => (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 mt-4">
            <button
                onClick={() => setActiveSectionIndex(prev => Math.max(0, prev - 1))}
                disabled={isFirstSection}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-600"
            >
                <ChevronLeft className="w-4 h-4" />
                Phần trước
            </button>
            <div className="text-sm font-medium text-slate-600 hidden sm:block">
                Phần {activeSectionIndex + 1} / {groupedQuestions.length}
            </div>
            {isLastSection ? (
                <SubmitButton className="px-6 py-2 rounded-lg text-sm" />
            ) : (
                <button
                    onClick={() => setActiveSectionIndex(prev => Math.min(groupedQuestions.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 transition shadow-sm"
                >
                    Tiếp theo
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );

    // Section Selector Dropdown/Tabs
    const SectionSelector = () => (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">
            {groupedQuestions.map((group, idx) => (
                <button
                    key={idx}
                    onClick={() => setActiveSectionIndex(idx)}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition border ${activeSectionIndex === idx
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                >
                    {group.sectionType === "READING" ? "📖 " : "📝 "}
                    {group.sectionTitle.length > 20 ? group.sectionTitle.substring(0, 20) + "..." : group.sectionTitle}
                </button>
            ))}
        </div>
    );


    const AppearanceControl = (
        <div className="relative appearance-control" ref={appearanceRef}>
            <button
                onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-sm font-medium ${isAppearanceOpen
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
            >
                <span className="text-base">Aa</span>
            </button>

            {isAppearanceOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 transform origin-top-right">
                    <div className="space-y-4">
                        {/* Passage Font Size */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cỡ chữ bài đọc</span>
                                <input
                                    type="number"
                                    min={12}
                                    max={32}
                                    value={passageFontSize}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) setPassageFontSize(Math.max(12, Math.min(32, val)));
                                    }}
                                    className="w-12 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-transparent focus:border-indigo-500 focus:outline-none text-center"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setPassageFontSize(prev => Math.max(12, prev - 1))}
                                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-indigo-600 active:scale-95 transition"
                                >
                                    A-
                                </button>
                                <div className="flex-1 h-1 bg-slate-200 rounded-full mx-2 overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: `${((passageFontSize - 12) / 20) * 100}%` }}
                                    ></div>
                                </div>
                                <button
                                    onClick={() => setPassageFontSize(prev => Math.min(32, prev + 1))}
                                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-indigo-600 active:scale-95 transition"
                                >
                                    A+
                                </button>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-slate-100"></div>

                        {/* Question Font Size */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cỡ chữ câu hỏi</span>
                                <input
                                    type="number"
                                    min={12}
                                    max={32}
                                    value={questionFontSize}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) setQuestionFontSize(Math.max(12, Math.min(32, val)));
                                    }}
                                    className="w-12 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-transparent focus:border-indigo-500 focus:outline-none text-center"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setQuestionFontSize(prev => Math.max(12, prev - 1))}
                                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-indigo-600 active:scale-95 transition"
                                >
                                    A-
                                </button>
                                <div className="flex-1 h-1 bg-slate-200 rounded-full mx-2 overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: `${((questionFontSize - 12) / 20) * 100}%` }}
                                    ></div>
                                </div>
                                <button
                                    onClick={() => setQuestionFontSize(prev => Math.min(32, prev + 1))}
                                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-indigo-600 active:scale-95 transition"
                                >
                                    A+
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (isSubmitted && submissionResult) {
        // Check if showAnswersAfterSubmit setting
        const showAnswers = assignment.settings?.showAnswersAfterSubmit !== false;

        // Calculate question start index for each section
        const getSectionStartIndex = (sectionIdx: number) => {
            let count = 0;
            for (let i = 0; i < sectionIdx; i++) {
                count += groupedQuestions[i]?.questions.length || 0;
            }
            return count;
        };

        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Attempt Tabs - Show if multiple attempts exist */}
                {allSubmissions.length > 1 && (
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                            <History className="w-4 h-4" />
                            Lịch sử làm bài:
                        </span>
                        {allSubmissions.map((sub, idx) => (
                            <button
                                key={sub.id}
                                onClick={() => handleViewAttempt(idx)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewingAttempt === idx || (viewingAttempt === null && idx === allSubmissions.length - 1)
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                Lần {sub.attemptNumber || idx + 1}
                                {sub.score !== null && (
                                    <span className="ml-1 opacity-75">({Number.isInteger(sub.score) ? sub.score : sub.score?.toFixed(1)}đ)</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Current Attempt Label */}
                {submissionResult.attemptNumber && (
                    <div className="text-center mb-4">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Lần làm thứ {submissionResult.attemptNumber}
                        </span>
                    </div>
                )}

                {/* Score Card */}
                <AssignmentResult
                    submissionResult={submissionResult}
                    questions={assignment.questions}
                    streamingFeedback={streamingFeedback}
                />

                {/* MCQ / Gap-fill / Other Question Results Review */}
                <div className="mt-8 space-y-2">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
                        <ClipboardList className="w-5 h-5 text-indigo-600" />
                        Chi tiết bài làm
                    </h3>

                    {/* Section tabs for multi-section tests */}
                    {groupedQuestions.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
                            {groupedQuestions.map((group, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSectionIndex(idx)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition border ${activeSectionIndex === idx
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {group.sectionTitle.length > 20 ? group.sectionTitle.substring(0, 20) + "..." : group.sectionTitle}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Render active section with results */}
                    <SectionContent
                        group={groupedQuestions[activeSectionIndex]}
                        answers={answers}
                        onAnswerChange={() => { }} // Read-only after submission
                        showPassage={true}
                        startIndex={getSectionStartIndex(activeSectionIndex)}
                        submissionResult={showAnswers ? submissionResult : undefined}
                        passageFontSize={passageFontSize}
                        questionFontSize={questionFontSize}
                        showAnswersAfterSubmit={showAnswers}
                    />

                    {/* Navigation for multi-section */}
                    {groupedQuestions.length > 1 && (
                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 mt-4">
                            <button
                                onClick={() => setActiveSectionIndex(prev => Math.max(0, prev - 1))}
                                disabled={activeSectionIndex === 0}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-600"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Phần trước
                            </button>
                            <div className="text-sm font-medium text-slate-600">
                                Phần {activeSectionIndex + 1} / {groupedQuestions.length}
                            </div>
                            <button
                                onClick={() => setActiveSectionIndex(prev => Math.min(groupedQuestions.length - 1, prev + 1))}
                                disabled={activeSectionIndex === groupedQuestions.length - 1}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tiếp theo
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center gap-3">
                    {canRetry && viewingAttempt === null && (
                        <button
                            onClick={handleStartNewAttempt}
                            disabled={isStartingNewAttempt}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-200"
                        >
                            {isStartingNewAttempt ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            Làm lại (còn {remainingAttempts} lượt)
                        </button>
                    )}

                    {!canRetry && viewingAttempt === null && (
                        <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
                            Bạn đã sử dụng hết {maxAttempts} lượt làm bài
                        </div>
                    )}

                    {viewingAttempt !== null && (
                        <button
                            onClick={() => handleViewAttempt(allSubmissions.length - 1)}
                            className="px-6 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-600 transition"
                        >
                            Xem lần làm mới nhất
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const isQuiz = assignment.type !== "LECTURE"; // Should be true for QuizRunner usually, but good to check

    return (
        <div ref={quizContainerRef} className="flex flex-col h-full bg-slate-50">
            {/* Title Card (Moved from page.tsx) */}
            {!isFullscreen && (
                <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 z-20">
                    <div className="max-w-[1800px] mx-auto w-full">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isQuiz ? "bg-orange-50" : "bg-indigo-50"
                                }`}>
                                {isQuiz ? <ClipboardList className="w-6 h-6 text-orange-600" /> : <FileText className="w-6 h-6 text-indigo-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                                    {/* Max Attempts Badge */}
                                    {isQuiz && maxAttempts > 1 && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            <RefreshCw className="w-3 h-3" />
                                            Được làm {maxAttempts} lần
                                        </span>
                                    )}
                                    {/* Current Attempt Info */}
                                    {isQuiz && currentAttemptCount > 0 && (
                                        <span className="text-xs text-slate-500">
                                            • Đã làm {currentAttemptCount}/{maxAttempts} lần
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-xl font-bold text-slate-900 break-words">
                                    {assignment.title}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Progress Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 z-20 shadow-sm relative">
                <div className="max-w-[1800px] mx-auto w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-700 hidden md:inline">Tiến độ làm bài</span>

                            {/* Simple Progress Bar */}
                            <div className="w-32 md:w-48 bg-slate-100 h-2 rounded-full">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                {answeredCount}/{totalQuestions}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Countdown Timer */}
                            {hasTimeLimit && timerStarted && !isSubmitted && (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${timeRemaining <= 300
                                    ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                                    : timeRemaining <= 600
                                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                    {formatTime(timeRemaining)}
                                </div>
                            )}

                            {/* Deadline Badge */}
                            {deadlineDate && !isSubmitted && (
                                <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${isDeadlineExpired
                                    ? "bg-red-50 text-red-600 border-red-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}>
                                    📅 {isDeadlineExpired ? "Hết hạn" : `Hạn: ${deadlineDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} ${deadlineDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`}
                                </div>
                            )}
                            {AppearanceControl}

                            {/* Fullscreen Toggle */}
                            <button
                                onClick={toggleFullscreen}
                                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                                className={`flex items-center justify-center px-2 py-1.5 rounded-lg border transition text-sm font-medium ${isFullscreen ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>

                            {/* Submit Button (Header - always visible on desktop) */}
                            {!isSubmitted ? (
                                <button
                                    onClick={onSubmit}
                                    disabled={isSubmitting || isTimerWarningActive}
                                    className="hidden md:flex bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Nộp bài
                                </button>
                            ) : (
                                <div className="hidden md:flex px-4 py-1.5 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Đã nộp bài - Điểm: {submissionResult?.score ?? 0}/{submissionResult?.totalScore ?? 0}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Selector */}
                    <SectionSelector />
                </div>
            </div>

            {/* Content Area */}
            {isTimerWarningActive ? (
                <div className="flex-1 flex justify-center p-6 lg:p-12 overflow-y-auto w-full">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl h-fit overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-200">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Clock className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold">Bài tập có giới hạn thời gian</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                                <p className="text-3xl font-bold text-amber-700">
                                    {Math.floor(timeLimitMinutes / 60) > 0 ? `${Math.floor(timeLimitMinutes / 60)} giờ ` : ""}{timeLimitMinutes % 60 > 0 ? `${timeLimitMinutes % 60} phút` : ""}
                                </p>
                                <p className="font-medium text-amber-600 mt-2">để hoàn thành bài tập</p>
                            </div>
                            <div className="text-slate-600 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm">
                                <p className="flex items-start gap-3">
                                    <span className="shrink-0 mt-0.5 text-lg">⚠️</span>
                                    <span className="leading-relaxed">Thời gian sẽ <strong>bắt đầu đếm ngược</strong> ngay khi bạn bấm Bắt đầu.</span>
                                </p>
                                <p className="flex items-start gap-3">
                                    <span className="shrink-0 mt-0.5 text-lg">⚠️</span>
                                    <span className="leading-relaxed">Nếu hết giờ, bài làm sẽ được <strong>tự động nộp</strong>.</span>
                                </p>
                                <p className="flex items-start gap-3">
                                    <span className="shrink-0 mt-0.5 text-lg">⚠️</span>
                                    <span className="leading-relaxed">Bạn không thể tạm dừng hoặc làm lại từ đầu.</span>
                                </p>
                                {deadlineDate && (
                                    <p className="flex items-start gap-3 text-red-600 font-medium">
                                        <span className="shrink-0 mt-0.5 text-lg">📅</span>
                                        <span className="leading-relaxed">Hạn nộp: {deadlineDate.toLocaleString("vi-VN", { dateStyle: "long", timeStyle: "short" })}</span>
                                    </p>
                                )}
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={handleStartTimer}
                                    className="w-full px-4 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg hover:from-emerald-700 hover:to-emerald-600 transition shadow-lg shadow-emerald-200 hover:-translate-y-0.5"
                                >
                                    🚀 Bắt đầu làm bài
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Desktop Split View */}
                    <div className="flex-1 hidden lg:block overflow-hidden relative">
                        <ResizableSplitPane
                            // Passage Pane (Left)
                            left={
                                <div id="split-left" className="h-full overflow-y-auto p-6 pb-20 scroll-smooth">
                                    <PassageViewer
                                        sectionTitle={activeGroup.sectionTitle}
                                        passage={activeGroup.passage}
                                        passageTranslation={activeGroup.passageTranslation}
                                        sectionImages={activeGroup.sectionImages}
                                        sectionVideo={activeGroup.sectionVideo}
                                        fontSize={passageFontSize}
                                    />
                                </div>
                            }
                            // Questions Pane (Right)
                            right={
                                <div id="split-right" className="h-full overflow-y-auto w-full p-6 flex flex-col scroll-smooth">
                                    <div className="flex-1 animate-in slide-in-from-right-4 duration-300">
                                        {submissionResult ? (
                                            <AssignmentResult
                                                submissionResult={submissionResult}
                                                questions={assignment.questions}
                                                streamingFeedback={streamingFeedback}
                                                onRetryAiGrading={retryAiGrading}
                                            />
                                        ) : (
                                            <SectionContent
                                                group={activeGroup}
                                                answers={answers}
                                                onAnswerChange={onAnswerChange}
                                                showPassage={false} // Don't show passage on right side in Split View
                                                startIndex={currentSectionStartIndex}
                                                submissionResult={submissionResult}
                                                passageFontSize={passageFontSize}
                                                questionFontSize={questionFontSize}
                                                showAnswersAfterSubmit={assignment.settings?.showAnswersAfterSubmit !== false}
                                            />
                                        )}
                                    </div>

                                    {/* Navigation Footer */}
                                    <NavigationControls />
                                </div>
                            }
                        />
                    </div>

                    {/* Mobile Stacked View */}
                    <div id="mobile-container" className="flex-1 lg:hidden overflow-y-auto bg-slate-50 p-4 scroll-smooth">
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <SectionContent
                                group={activeGroup}
                                answers={answers}
                                onAnswerChange={onAnswerChange}
                                showPassage={true}
                                startIndex={currentSectionStartIndex}
                                submissionResult={submissionResult}
                                passageFontSize={passageFontSize}
                                questionFontSize={questionFontSize}
                                showAnswersAfterSubmit={assignment.settings?.showAnswersAfterSubmit !== false}
                            />
                        </div>

                        <div className="mt-6 pb-20">
                            <NavigationControls />
                        </div>
                    </div>
                    {/* Sticky Audio Player */}
                    {(activeGroup.sectionAudio || assignment.settings?.audioUrl) && (
                        <StickyAudioPlayer
                            src={activeGroup.sectionAudio || assignment.settings?.audioUrl}
                            key={activeGroup.sectionAudio || assignment.settings?.audioUrl} // Force remount on source change to be safe
                        />
                    )}
                </>
            )}
        </div>
    );
};

const McqQuestionSimple = ({
    question,
    value,
    onChange,
    result,
    isMultiSelect,
    showAnswersAfterSubmit = true,
}: {
    question: ParsedQuestion;
    value: string | undefined;
    onChange: (val: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result?: any;
    isMultiSelect?: boolean;
    showAnswersAfterSubmit?: boolean;
}) => {
    const { parsed } = question;

    // Auto-detect TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN questions
    // If no options but answer matches T/F/NG pattern, generate options
    const effectiveOptions = useMemo(() => {
        if (parsed.options && parsed.options.length > 0) {
            return parsed.options;
        }
        // Check if correctAnswer suggests TRUE/FALSE/NOT GIVEN
        const answer = (question.correctAnswer || "").toUpperCase().trim();
        if (["TRUE", "FALSE", "NOT GIVEN"].includes(answer)) {
            return ["TRUE", "FALSE", "NOT GIVEN"];
        }
        if (["YES", "NO", "NOT GIVEN"].includes(answer)) {
            return ["YES", "NO", "NOT GIVEN"];
        }
        return parsed.options || [];
    }, [parsed.options, question.correctAnswer]);

    // Fallback: If no items are present, try to extract them from the text
    // This handles older assignments where items were merged into the text
    const displayData = useMemo(() => {
        if (parsed.items && parsed.items.length > 0) {
            return { text: parsed.text, items: parsed.items };
        }

        // Attempt to extract "a. ... b. ..." pattern
        const regex = /(?:^|\s)([a-e])\.\s+(.*?)(?=\s+[a-e]\.\s+|$)/g;
        const matches = Array.from(parsed.text.matchAll(regex));

        if (matches.length >= 2) {
            const items = matches.map(m => `${m[1]}. ${m[2]}`);
            // The intro is everything before the first item
            const firstMatchIndex = parsed.text.indexOf(matches[0][0]);
            const intro = parsed.text.substring(0, firstMatchIndex).trim();
            return { text: intro, items };
        }

        return { text: parsed.text, items: [] };
    }, [parsed.text, parsed.items]);

    return (
        <div className="space-y-4">
            {/* Question Text */}
            {displayData.text && (
                <div className="font-medium text-slate-900 [&>p]:inline [&>strong]:font-bold [&>em]:italic">
                    <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            p: ({ children }) => <div className="inline">{children}</div>
                        }}
                    >
                        {displayData.text}
                    </ReactMarkdown>
                </div>
            )}

            {/* Display Items for ORDERING questions */}
            {displayData.items.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="font-medium text-amber-700 mb-2">
                        📝 Các câu cần sắp xếp:
                    </div>
                    {displayData.items.map((item, index) => (
                        <div
                            key={index}
                            className="text-slate-700 pl-3 py-2 border-l-3 border-amber-400 bg-white rounded-r-lg px-3 shadow-sm"
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {/* Options */}
            {effectiveOptions && effectiveOptions.length > 0 && (
                <div className="flex flex-col space-y-2">
                    {effectiveOptions.map((option, index) => {
                        const optionValue = typeof option === 'string' ? option : option;
                        // Single Select vs Multi Select check
                        const isSelected = isMultiSelect
                            ? (value ? value.split(",").includes(optionValue) : false)
                            : (value === optionValue);

                        // Result Styling
                        let resultClass = "";
                        let disabled = false;
                        let isCorrectAnswer = false;

                        if (result) {
                            // Resolve correct answers: support both letter-based ("A") and text-based correctAnswer
                            const correctAnswerRaw = result.correctAnswer || "";
                            const correctAnswersList = correctAnswerRaw.split(",").map((s: string) => s.trim());
                            const optionLetter = String.fromCharCode(65 + index);

                            // Check if this option is correct:
                            // 1. Direct match: optionValue matches a correct answer string
                            // 2. Letter match: option's letter (A,B,C...) matches a correct answer letter
                            // 3. Index match: correct answer is a letter and this option is at that index
                            const isLetterBased = correctAnswersList.every((a: string) => /^[A-E]$/.test(a));
                            if (isLetterBased) {
                                // correctAnswer is letter-based like "A" or "A,C"
                                isCorrectAnswer = correctAnswersList.includes(optionLetter);
                            } else {
                                // correctAnswer is text-based
                                const stripHtml = (s: string) => (s || "").replace(/<[^>]*>/g, "").trim().toLowerCase();
                                isCorrectAnswer = correctAnswersList.some((ca: string) =>
                                    ca === optionValue ||
                                    ca === optionLetter ||
                                    stripHtml(ca) === stripHtml(optionValue)
                                );
                            }

                            if (isCorrectAnswer) {
                                // Correct Answer
                                if (showAnswersAfterSubmit !== false) {
                                    resultClass = "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200 text-emerald-800";
                                } else {
                                    resultClass = "opacity-60"; // Hide styling if not allowed to show
                                }
                            } else if (isSelected && !result.isCorrect) {
                                // Selected but Wrong
                                resultClass = "border-red-500 bg-red-100 ring-2 ring-red-200 text-red-800";
                            } else if (isSelected && isCorrectAnswer) {
                                // Selected and Correct
                                resultClass = "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200 text-emerald-800";
                            } else {
                                // Not selected, plain
                                resultClass = "opacity-60";
                            }
                        } else {
                            // Normal Interaction state
                            if (isSelected) {
                                resultClass = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-200 text-indigo-700 shadow-sm";
                            } else {
                                resultClass = "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700";
                            }
                        }

                        return (
                            <button
                                key={index}
                                disabled={!!result}
                                onClick={() => {
                                    if (result) return;

                                    if (isMultiSelect) {
                                        const currentSelected = value ? value.split(",").filter(Boolean) : [];
                                        let newSelected;
                                        if (isSelected) {
                                            newSelected = currentSelected.filter(v => v !== optionValue);
                                        } else {
                                            newSelected = [...currentSelected, optionValue];
                                        }
                                        newSelected.sort();
                                        onChange(newSelected.join(","));
                                    } else {
                                        onChange(optionValue);
                                    }
                                }}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 group relative ${resultClass}`}
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                    ? (result ? (isCorrectAnswer ? "border-emerald-500 bg-emerald-500 text-white" : "border-red-500 bg-red-500 text-white") : "border-indigo-600 bg-indigo-600 text-white")
                                    : (result && isCorrectAnswer && showAnswersAfterSubmit !== false ? "border-emerald-500 bg-emerald-500 text-emerald-100" : "border-slate-300 group-hover:border-indigo-400")
                                    }`}>
                                    {/* Icon */}
                                    {isMultiSelect ? (
                                        isSelected ? <CheckCircle className="w-3.5 h-3.5" /> : null
                                    ) : (
                                        isSelected && <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <span
                                        className="font-medium"
                                        dangerouslySetInnerHTML={{ __html: String(option) }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Explanation / Result Text */}
            {result && (
                <div className={`mt-3 p-3 rounded-lg flex flex-col gap-2 ${result.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    <div>
                        <span className="font-bold">{result.isCorrect ? "Chính xác!" : "Chưa chính xác!"}</span>
                        {!result.isCorrect && showAnswersAfterSubmit !== false && (
                            <span className="ml-2">Đáp án đúng: <strong>{result.correctAnswer}</strong></span>
                        )}
                    </div>
                    {question.explanation && showAnswersAfterSubmit !== false && (
                        <div className={`mt-1 pt-2 border-t text-sm ${result.isCorrect ? "border-emerald-200 text-emerald-800" : "border-red-200 text-red-800"}`}>
                            <strong>💡 Giải thích: </strong>
                            <div className="inline prose-sm"><ReactMarkdown>{question.explanation || ""}</ReactMarkdown></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
