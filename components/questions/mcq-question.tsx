import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

interface McqQuestionProps {
    question: {
        id: string;
        content: string; // JSON string
    };
    value: string | undefined;
    onChange: (val: string) => void;
    disabled?: boolean;
    isMultiSelect?: boolean;
}

interface ParsedContent {
    text: string;
    items?: string[];  // For ORDERING questions
    options?: string[] | { id: string; text: string }[];
    passage?: string;
    passageTranslation?: string;
    sectionTitle?: string;
    sectionType?: string;
}

export const McqQuestion = ({
    question,
    value,
    onChange,
    disabled,
    isMultiSelect
}: McqQuestionProps) => {
    const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);

    useEffect(() => {
        try {
            const parsed = JSON.parse(question.content);
            setParsedContent(parsed);
        } catch (e) {
            console.error("Failed to parse MCQ content", e);
            setParsedContent({ text: question.content, options: [] });
        }
    }, [question.content]);

    if (!parsedContent) return null;

    const handleMultiSelectChange = (optionValue: string, checked: boolean) => {
        const currentSelected = value ? value.split(",").filter(Boolean) : [];
        let newSelected;
        if (checked) {
            newSelected = [...currentSelected, optionValue];
        } else {
            newSelected = currentSelected.filter(v => v !== optionValue);
        }
        // sort alphabetical A, B, C... (Assuming values are simple IDs or chars, but sort keeps consistency)
        newSelected.sort();
        onChange(newSelected.join(","));
    };

    return (
        <div className="space-y-4">
            {/* Display Passage if present */}
            {parsedContent.passage && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-3">
                        <BookOpen className="w-4 h-4" />
                        <span>Đọc đoạn văn sau:</span>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {parsedContent.passage}
                    </div>
                    {parsedContent.passageTranslation && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-xs font-medium text-slate-500 mb-1">Tạm dịch:</div>
                            <div className="text-sm text-slate-600 italic whitespace-pre-wrap">
                                {parsedContent.passageTranslation}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Question Text */}
            <div className="text-base font-medium text-slate-900">
                {parsedContent.text}
                {isMultiSelect && (
                    <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        (Chọn nhiều đáp án)
                    </span>
                )}
            </div>

            {/* Display Items for ORDERING questions (sentences on separate lines) */}
            {parsedContent.items && parsedContent.items.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="text-sm font-medium text-amber-700 mb-2">
                        Các câu cần sắp xếp:
                    </div>
                    {parsedContent.items.map((item, index) => (
                        <div
                            key={index}
                            className="text-sm text-slate-700 pl-2 py-1 border-l-2 border-amber-300 bg-white rounded-r px-3"
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {/* Options */}
            {parsedContent.options && parsedContent.options.length > 0 && (
                isMultiSelect ? (
                    /* Multi-Select (Checkbox) */
                    <div className="flex flex-col space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {parsedContent.options.map((option: any, index: number) => {
                            const optionValue = typeof option === 'string' ? option : option.id;
                            const optionLabel = typeof option === 'string' ? option : option.text;
                            // Check if value (comma separated) contains this option
                            const isChecked = value ? value.split(",").includes(optionValue) : false;

                            return (
                                <div key={index} className="flex items-center space-x-3 border border-slate-200 p-3 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer">
                                    <Checkbox
                                        id={`${question.id}-${index}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => handleMultiSelectChange(optionValue, checked as boolean)}
                                        disabled={disabled}
                                    />
                                    <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer font-normal text-slate-700">
                                        {optionLabel}
                                    </Label>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    /* Single Select (Radio) */
                    <RadioGroup
                        disabled={disabled}
                        onValueChange={onChange}
                        value={value}
                        className="flex flex-col space-y-2"
                    >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {parsedContent.options.map((option: any, index: number) => {
                            const optionValue = typeof option === 'string' ? option : option.id;
                            const optionLabel = typeof option === 'string' ? option : option.text;

                            return (
                                <div key={index} className="flex items-center space-x-3 border border-slate-200 p-3 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer">
                                    <RadioGroupItem value={optionValue} id={`${question.id}-${index}`} />
                                    <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer font-normal text-slate-700">
                                        {optionLabel}
                                    </Label>
                                </div>
                            )
                        })}
                    </RadioGroup>
                )
            )}
        </div>
    );
};
