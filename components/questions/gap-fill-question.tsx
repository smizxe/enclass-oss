"use client";

import { Input } from "@/components/ui/input";
import { useMemo } from "react";

interface GapFillQuestionProps {
    question: {
        id: string;
        content: string; // "This is a {gap} fill question." or JSON with text
        parsed?: {
            text?: string;
        };
    };
    value: Record<number, string> | string | undefined;
    onChange: (val: Record<number, string> | string) => void;
    disabled?: boolean;
    result?: {
        isCorrect: boolean;
        correctAnswer: string;
        // Extended fields for multi-gap partial credit
        perGapResults?: { isCorrect: boolean; correctAnswer: string }[];
        score?: number;
    };
}

export const GapFillQuestion = ({
    question,
    value,
    onChange,
    disabled,
    result
}: GapFillQuestionProps) => {
    // Get the actual text - either from parsed or directly from content
    const questionText = useMemo(() => {
        if (question.parsed?.text) {
            return question.parsed.text;
        }
        try {
            const parsed = JSON.parse(question.content);
            return parsed.text || question.content;
        } catch {
            return question.content;
        }
    }, [question.content, question.parsed]);

    // Check if we have {gap} style or _____ style or simple mode
    const hasBraceGaps = questionText.includes("{") && questionText.includes("}");
    const hasUnderscoreGaps = questionText.includes("_____");

    // For {gap} style — Universal HTML renderer with inline inputs
    if (hasBraceGaps) {
        const parts = questionText.split(/(\{.*?\})/g);
        let inputCounter = 0;
        const recordValue = (typeof value === 'object' ? value : {}) as Record<number, string>;

        const handleInputChange = (index: number, text: string) => {
            onChange({
                ...recordValue,
                [index]: text
            });
        };

        // Parse per-gap results from the correctAnswer string (separated by |)
        const perGapResults = result?.perGapResults;

        return (
            <div>
                {/* Render the content as HTML with inline inputs */}
                <div className="leading-8 prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 prose-p:mb-1 prose-ul:my-1 prose-li:my-0 [&_strong]:font-bold [&_em]:italic [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2">
                    {parts.map((part: string, index: number) => {
                        if (part.startsWith("{") && part.endsWith("}")) {
                            const currentInputIndex = inputCounter++;
                            const gapResult = perGapResults?.[currentInputIndex];

                            return (
                                <span key={index} className="inline-block mx-1 align-middle">
                                    <span className="text-xs font-bold text-indigo-500 mr-1">
                                        {currentInputIndex + 1}
                                    </span>
                                    <Input
                                        className={`w-36 h-8 inline-flex text-sm ${gapResult
                                            ? (gapResult.isCorrect
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                                                : "border-red-400 bg-red-50 text-red-700")
                                            : "border-indigo-200 focus:border-indigo-500"
                                            }`}
                                        disabled={disabled}
                                        value={recordValue[currentInputIndex] || ""}
                                        onChange={(e) => handleInputChange(currentInputIndex, e.target.value)}
                                        placeholder="............"
                                    />
                                    {/* Show correct answer inline if wrong */}
                                    {gapResult && !gapResult.isCorrect && (
                                        <span className="ml-1 text-xs text-red-600 font-medium">
                                            → {gapResult.correctAnswer}
                                        </span>
                                    )}
                                </span>
                            );
                        }
                        // Render non-gap parts as HTML to preserve structure
                        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
                    })}
                </div>

                {/* Overall result feedback for multi-gap */}
                {result && (
                    <div className={`mt-4 p-3 rounded-lg ${result.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {result.isCorrect ? (
                            <span className="font-bold">✅ Chính xác tất cả!</span>
                        ) : (
                            <span className="font-medium">
                                📊 Kết quả: {result.score !== undefined ? `${result.score}` : (result.isCorrect ? "Đúng" : "Chưa đúng hết")}
                                {result.correctAnswer && !result.perGapResults && (
                                    <span className="ml-2">— Đáp án: <strong>{result.correctAnswer}</strong></span>
                                )}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // For _____ style or simple typed input - single input mode
    const stringValue = typeof value === 'string' ? value : '';

    return (
        <div className="space-y-4">
            {/* Question text with blanks shown */}
            <div className="text-slate-800 leading-relaxed">
                {hasUnderscoreGaps ? (
                    questionText.split(/(_____+)/g).map((part: string, index: number) => {
                        if (part.match(/^_+$/)) {
                            return (
                                <span key={index} className="inline-block mx-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-mono">
                                    ({index + 1})
                                </span>
                            );
                        }
                        return <span key={index}>{part}</span>;
                    })
                ) : (
                    <span>{questionText}</span>
                )}
            </div>

            {/* Single Input */}
            <div className="flex flex-col gap-2">
                <label className="font-medium text-slate-600">Câu trả lời của bạn:</label>
                <Input
                    className={`max-w-md ${result
                        ? (result.isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-red-500 bg-red-50 text-red-700"
                        )
                        : ""
                        }`}
                    disabled={disabled || !!result}
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Nhập câu trả lời..."
                />
            </div>

            {/* Result feedback */}
            {result && (
                <div className={`p-3 rounded-lg ${result.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    <span className="font-bold">{result.isCorrect ? "Chính xác!" : "Chưa chính xác!"}</span>
                    {!result.isCorrect && (
                        <span className="ml-2">Đáp án đúng: <strong>{result.correctAnswer}</strong></span>
                    )}
                </div>
            )}
        </div>
    );
};
