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
 * 3. Full fallback: returns null to use default card layout
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
}: CompactGapFillSectionProps) => {
    // Build a map: questionNumber -> question data
    const questionMap = useMemo(() => {
        const map = new Map<number, CompactQuestion>();
        questions.forEach((q, idx) => {
            const num = startIndex + idx + 1;
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
            const patterns = [
                new RegExp(`(\\b${num})\\s*[\\.…]{3,}`, 'g'),
                new RegExp(`(\\b${num})\\s*_{3,}`, 'g'),
            ];
            for (const pattern of patterns) {
                if (pattern.test(processed)) {
                    processed = processed.replace(pattern, `{${num}}`);
                    foundMarkers = true;
                }
            }
        }

        return foundMarkers ? processed : null; // null = can't detect, use fallback
    }, [passage, hasAIMarkers, questionMap]);

    // If no markers found at all, return null to signal fallback to card layout
    if (!processedPassage) {
        return null;
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
