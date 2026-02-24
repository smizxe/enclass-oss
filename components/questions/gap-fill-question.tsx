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

    // For {gap} style - existing MCQ-like behavior
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

        return (
            <div className="text-base leading-8">
                {parts.map((part: string, index: number) => {
                    if (part.startsWith("{") && part.endsWith("}")) {
                        const currentInputIndex = inputCounter++;
                        return (
                            <span key={index} className="inline-block mx-1">
                                <Input
                                    className="w-32 h-8 inline-flex"
                                    disabled={disabled}
                                    value={recordValue[currentInputIndex] || ""}
                                    onChange={(e) => handleInputChange(currentInputIndex, e.target.value)}
                                    placeholder="____"
                                />
                            </span>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>
        );
    }

    // For _____ style or simple typed input - single input mode
    const stringValue = typeof value === 'string' ? value : '';

    return (
        <div className="space-y-4">
            {/* Question text with blanks shown */}
            <div className="text-base text-slate-800 leading-relaxed">
                {hasUnderscoreGaps ? (
                    questionText.split(/(_____+)/g).map((part: string, index: number) => {
                        if (part.match(/^_+$/)) {
                            return (
                                <span key={index} className="inline-block mx-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-mono text-sm">
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
                <label className="text-sm font-medium text-slate-600">Câu trả lời của bạn:</label>
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
                <div className={`p-3 rounded-lg text-sm ${result.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    <span className="font-bold">{result.isCorrect ? "Chính xác!" : "Chưa chính xác!"}</span>
                    {!result.isCorrect && (
                        <span className="ml-2">Đáp án đúng: <strong>{result.correctAnswer}</strong></span>
                    )}
                </div>
            )}
        </div>
    );
};
