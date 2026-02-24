"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface McqQuestionProps {
    question: {
        id: string;
        content: string; // JSON string
    };
    value: string | undefined;
    onChange: (val: string) => void;
    disabled?: boolean;
}

export const McqQuestion = ({
    question,
    value,
    onChange,
    disabled
}: McqQuestionProps) => {
    const [parsedContent, setParsedContent] = useState<{
        text: string;
        options: string[] | { id: string; text: string }[];
    } | null>(null);

    useEffect(() => {
        try {
            const parsed = JSON.parse(question.content);
            // Normalize simple strings to objects if needed, or just handle strings
            setParsedContent(parsed);
        } catch (e) {
            console.error("Failed to parse MCQ content", e);
            setParsedContent({ text: "Error loading question", options: [] });
        }
    }, [question.content]);

    if (!parsedContent) return null;

    return (
        <div className="space-y-4">
            <div className="text-base font-medium">
                {parsedContent.text}
            </div>

            <RadioGroup
                disabled={disabled}
                onValueChange={onChange}
                value={value}
                className="flex flex-col space-y-2"
            >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {parsedContent.options.map((option: any, index: number) => {
                    // Handle both string array and object array
                    const optionValue = typeof option === 'string' ? option : option.id;
                    const optionLabel = typeof option === 'string' ? option : option.text;

                    return (
                        <div key={index} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 transition">
                            <RadioGroupItem value={optionValue} id={`${question.id}-${index}`} />
                            <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer font-normal">
                                {optionLabel}
                            </Label>
                        </div>
                    )
                })}
            </RadioGroup>
        </div>
    );
};
