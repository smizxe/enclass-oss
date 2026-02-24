"use client";

import { Input } from "@/components/ui/input";
import { useMemo } from "react";

interface GapFillQuestionProps {
    question: {
        id: string;
        content: string; // "This is a {gap} fill question."
    };
    value: Record<number, string> | undefined;
    onChange: (val: Record<number, string>) => void;
    disabled?: boolean;
}

export const GapFillQuestion = ({
    question,
    value = {},
    onChange,
    disabled
}: GapFillQuestionProps) => {
    // Regex to find {text}
    const parts = useMemo(() => {
        // specific regex to capture braces content and text around it
        // splits "A {B} C" into ["A ", "{B}", " C"]
        return question.content.split(/(\{.*?\})/g);
    }, [question.content]);

    const handleInputChange = (index: number, text: string) => {
        onChange({
            ...value,
            [index]: text
        });
    };

    let inputCounter = 0;

    return (
        <div className="text-base leading-8">
            {parts.map((part, index) => {
                if (part.startsWith("{") && part.endsWith("}")) {
                    const currentInputIndex = inputCounter++;
                    // The text inside {} is technically the answer, but we don't show it.
                    // We just show an input.
                    // Ideally we might want a hint? For now, no hint.

                    return (
                        <span key={index} className="inline-block mx-1">
                            <Input
                                className="w-32 h-8 inline-flex"
                                disabled={disabled}
                                value={value[currentInputIndex] || ""}
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
};
