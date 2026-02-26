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

        // 4. Synthetic Passage Strategy (Auto-stitch) - Final Fallback for "Note Completion"
        // If we still haven't found key phrases in the passage, it's likely a "Note/Summary" 
        // where the text exists ONLY in the questions, not in the main passage.
        // We reconstruct the Note Block by concatenating question texts.
        if (!foundMarkers && questionMap.size > 0 && mode !== "teacher_preview") {
            const syntheticParts = [];
            // Sort by index to maintain order
            const sortedByNum = Array.from(questionMap.entries()).sort(([a], [b]) => a - b);

            for (const [num, q] of sortedByNum) {
                const text = q.parsed.text || "";
                // Append text + marker + newline
                syntheticParts.push(`${text} {${num}}`);
            }

            if (syntheticParts.length > 0) {
                // Return a special object or string to indicate synthetic mode? 
                // We can just return the joined string, but we need a flag to know it's synthetic 
                // (to add the border styling).
                // Hack: prepend a special flag that we check in render
                return "[[SYNTHETIC]]" + syntheticParts.join("<br/><br/>");
            }
        }

        return foundMarkers ? processed : null; // null = can't detect, use fallback
    }, [passage, hasAIMarkers, questionMap, mode]);

    // Check if it's synthetic (reconstructed) passage
    const isSynthetic = !!processedPassage && processedPassage.startsWith("[[SYNTHETIC]]");
    const finalPassage = isSynthetic ? processedPassage!.replace("[[SYNTHETIC]]", "") : processedPassage;

    // If no markers found at all (and strict mode or synthetic failed), fallback to List View
    if (!finalPassage) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5" style={{ fontSize: `${fontSize}px` }}>
                {/* Passage */}
                <div className="leading-8 prose prose-sm max-w-none mb-8 pb-8 border-b border-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{passage}</ReactMarkdown>
                </div>

                {/* Questions List */}
                {/* Questions List - Fallback View (Inline-like style) */}
                <div className="space-y-4">
                    {questions.map((q, idx) => {
                        const num = startIndex + idx + 1;
                        const result = results?.[q.id];
                        const currentValue = answers[q.id] || "";

                        return (
                            <div key={q.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                                <span className="flex-shrink-0 font-bold text-sm text-indigo-600 select-none">
                                    {num}.
                                </span>
                                <div className="flex-grow">
                                    <span className="text-slate-800 mr-2 leading-8">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                p: ({ children }) => <div className="inline">{children}</div>
                                            }}
                                        >
                                            {q.parsed.text || ""}
                                        </ReactMarkdown>
                                    </span>

                                    {mode === "teacher_preview" ? (
                                        <span className="inline-flex items-center gap-2 translate-y-[-1px]">
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-sm font-medium rounded border border-green-200">
                                                {q.correctAnswer}
                                            </span>
                                        </span>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 translate-y-1">
                                            <Input
                                                className={`w-40 h-8 text-sm ${result
                                                    ? (result.isCorrect ? "border-emerald-500 bg-emerald-50" : "border-red-400 bg-red-50")
                                                    : ""}`}
                                                value={currentValue}
                                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                                placeholder="............"
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
                        );
                    })}
                </div>
            </div>
        );
    }

    // Split passage by {N} markers and render inline inputs
    const parts = finalPassage.split(/(\{\d+\})/g);

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            style={{ fontSize: `${fontSize}px` }}
        >
            {/* If Synthetic: Render Original Passage first, THEN the Reconstructed Note/Summary Block. */}
            {/* If Synthetic: Render ONLY the Reconstructed Note/Summary Block. The Original Passage is already shown externally. */}

            <div className={`leading-9 text-slate-800 ${isSynthetic ? 'border border-slate-300 rounded-xl p-6 bg-slate-50/50' : 'prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 prose-p:mb-1 prose-ul:my-1 prose-li:my-0 [&_strong]:font-bold [&_em]:italic [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2'}`}>
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
                                // Render paragraphs as divs to stay inline when needed but allow block children
                                p: ({ children }) => <div className="inline">{children}</div>,
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
