"use client";

import { Input } from "@/components/ui/input";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface CompactQuestion {
    id: string;
    parsed: {
        text?: string;
    };
    correctAnswer: string;
    points: number;
    questionNumber?: number;
}

interface CompactGapFillSectionProps {
    passage: string;
    questions: CompactQuestion[];
    answers: Record<string, string>;
    onAnswerChange: (questionId: string, value: string) => void;
    disabled?: boolean;
    results?: Record<string, {
        isCorrect: boolean;
        correctAnswer: string;
    }>;
    startIndex: number;
    fontSize?: number;
    mode?: "student" | "teacher_preview";
}

/**
 * Compact Gap Fill Section
 * 
 * Renders a passage with inline {N} markers replaced by input fields.
 * This preserves the original exam structure (note completion, table completion, etc.)
 * instead of showing disconnected question cards.
 * 
 * Supports 3 tiers:
 * 1. AI markers: {N} in passage (primary)
 * 2. Regex fallback: N ........... or N _____ patterns
 * 3. Content matching: Fuzzy match question text in passage (legacy/bad AI import fallback)
 */
export const CompactGapFillSection = ({
    passage,
    questions,
    answers,
    onAnswerChange,
    disabled,
    results,
    startIndex,
    fontSize = 16,
    mode = "student",
}: CompactGapFillSectionProps) => {
    // Build a map: questionNumber -> question data
    const questionMap = useMemo(() => {
        const map = new Map<number, CompactQuestion>();
        questions.forEach((q, idx) => {
            const num = q.questionNumber || (startIndex + idx + 1);
            map.set(num, q);
        });
        return map;
    }, [questions, startIndex]);

    // Check if passage has {N} markers from AI
    const hasAIMarkers = useMemo(() => {
        return /\{\d+\}/.test(passage);
    }, [passage]);

    // Try regex fallback: find N ........... or N _____ patterns
    const processedPassage = useMemo(() => {
        if (hasAIMarkers) {
            return passage;
        }

        // Attempt regex fallback: replace "N ............" or "N _____" with {N}
        let processed = passage;
        let foundMarkers = false;

        for (const [num] of questionMap) {
            // Pattern: number followed by dots or underscores (with optional spaces)
            // No 'g' flag: each question number should appear once, and avoids .test()/.replace() lastIndex bug
            const patterns = [
                new RegExp(`(\\b${num})\\s*[\\.…]{3,}`),
                new RegExp(`(\\b${num})\\s*_{3,}`),
            ];
            for (const pattern of patterns) {
                const replaced = processed.replace(pattern, `{${num}}`);
                if (replaced !== processed) {
                    processed = replaced;
                    foundMarkers = true;
                    break; // Found match for this number, skip other patterns
                }
            }
        }

        // 3. Content Matching Strategy (for "bad" AI imports where Question = Sentence from Passage)
        // Example: Passage has "...diet consists of fern fronds...", Question has "diet consists of fern fronds..."
        if (!foundMarkers) {
            // Sort questions by length descending to match longest phrases first (avoids partial sub-matches)
            const sortedQuestions = Array.from(questionMap.entries())
                .sort(([, a], [, b]) => (b.parsed.text?.length || 0) - (a.parsed.text?.length || 0));

            for (const [num, q] of sortedQuestions) {
                if (!q.parsed.text) continue;

                // Clean question text: remove trailing dots, underscores, specific "Question N" prefixes if any
                // Also escape special regex characters
                const cleanText = q.parsed.text
                    .replace(/^Question \d+[:\.]\s*/i, "") // Remove "Question 7:" prefix
                    .replace(/[\._]{3,}$/, "") // Remove trailing dots/underscores
                    .trim();

                if (cleanText.length < 5) continue; // Skip very short text to avoid false positives

                // Escape for regex
                const escapedText = cleanText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // Find this text in passage. We want to replace the END of it with the marker, 
                // OR append the marker if the blank is conceptually at the end.
                // Actually, usually the question text IS the context. The blank follows it.
                // So we replace [Text] with [Text {N}]

                // Single .replace() call — avoids redundant regex work
                const regex = new RegExp(`(${escapedText})\\s*([\\._]{3,})?`, 'i');
                const replaced = processed.replace(regex, `$1 {${num}}`);
                if (replaced !== processed) {
                    processed = replaced;
                    foundMarkers = true;
                }
            }
        }

        return foundMarkers ? processed : null; // null = can't detect, use fallback
    }, [passage, hasAIMarkers, questionMap]);

    // If no markers found at all, fallback to a "List View" (Passage + Questions List)
    // This allows us to handle "bad" data gracefully without the parent needing to know.
    if (!processedPassage) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5" style={{ fontSize: `${fontSize}px` }}>
                {/* Passage */}
                <div className="leading-8 prose prose-sm max-w-none mb-8 pb-8 border-b border-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{passage}</ReactMarkdown>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.map((q, idx) => {
                        const num = startIndex + idx + 1;
                        const result = results?.[q.id];
                        const currentValue = answers[q.id] || "";

                        return (
                            <div key={q.id} className="flex flex-col gap-2">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-sm rounded-full">
                                        {num}
                                    </span>
                                    <div className="flex-grow pt-1.5">
                                        <div className="mb-2 text-slate-800">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{q.parsed.text || ""}</ReactMarkdown>
                                        </div>

                                        {mode === "teacher_preview" ? (
                                            <span className="inline-flex items-center gap-2">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded border border-green-200">
                                                    Đáp án: {q.correctAnswer}
                                                </span>
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    className={`max-w-md ${result
                                                        ? (result.isCorrect ? "border-emerald-500 bg-emerald-50" : "border-red-400 bg-red-50")
                                                        : ""}`}
                                                    value={currentValue}
                                                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                                    placeholder="Nhập câu trả lời..."
                                                    disabled={disabled || !!result}
                                                />
                                                {result && !result.isCorrect && (
                                                    <span className="text-sm text-red-600 font-medium">→ {result.correctAnswer}</span>
                                                )}
                                                {result?.isCorrect && <span className="text-emerald-600">✓</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Split passage by {N} markers and render inline inputs
    const parts = processedPassage.split(/(\{\d+\})/g);

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            style={{ fontSize: `${fontSize}px` }}
        >
            <div className="leading-8 prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 prose-p:mb-1 prose-ul:my-1 prose-li:my-0 [&_strong]:font-bold [&_em]:italic [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2">
                {parts.map((part, index) => {
                    // Check if this part is a {N} marker
                    const markerMatch = part.match(/^\{(\d+)\}$/);
                    if (markerMatch) {
                        const num = parseInt(markerMatch[1]);
                        const question = questionMap.get(num);

                        if (!question) {
                            // No matching question, render as text
                            return <span key={index} className="text-slate-400">[{num}]</span>;
                        }

                        if (mode === "teacher_preview") {
                            return (
                                <span key={index} className="inline-flex items-center gap-1 mx-1 align-middle">
                                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs font-medium rounded select-none">
                                        {num}
                                    </span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-200 select-none">
                                        {question.correctAnswer || "?"}
                                    </span>
                                </span>
                            );
                        }

                        const result = results?.[question.id];
                        const currentValue = answers[question.id] || "";

                        return (
                            <span key={index} className="inline-flex items-center gap-1 mx-1 align-middle">
                                <span className="text-xs font-bold text-indigo-500 select-none">
                                    {num}
                                </span>
                                <Input
                                    className={`w-32 sm:w-36 h-8 inline-flex text-sm ${result
                                        ? (result.isCorrect
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                                            : "border-red-400 bg-red-50 text-red-700")
                                        : "border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                                        }`}
                                    disabled={disabled || !!result}
                                    value={currentValue}
                                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                    placeholder="............"
                                />
                                {result && !result.isCorrect && (
                                    <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                                        → {result.correctAnswer}
                                    </span>
                                )}
                                {result?.isCorrect && (
                                    <span className="text-xs text-emerald-600">✓</span>
                                )}
                            </span>
                        );
                    }

                    // Render non-marker parts as markdown/HTML
                    if (!part.trim()) return null;

                    return (
                        <ReactMarkdown
                            key={index}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                // Render paragraphs as spans to stay inline when needed
                                p: ({ children }) => <span>{children}</span>,
                            }}
                        >
                            {part}
                        </ReactMarkdown>
                    );
                })}
            </div>
        </div>
    );
};
