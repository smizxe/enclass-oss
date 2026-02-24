"use client";

import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { CheckCircle, Send, Loader2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ResizableSplitPane } from "@/components/ui/resizable-split-pane";

import { McqQuestion } from "@/components/questions/mcq-question";
import { GapFillQuestion } from "@/components/questions/gap-fill-question";
import { SortableQuestion } from "@/components/questions/sortable-question";
import { EssayQuestion } from "@/components/questions/essay-question";

interface QuizRunnerProps {
    assignment: {
        id: string;
        title: string;
        type: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: any[];
    };
}

interface ParsedQuestion {
    id: string;
    type: string;
    content: string;
    points: number;
    parsed: {
        text: string;
        items?: string[];
        options?: string[];
        passage?: string;
        passageTranslation?: string;
        sectionTitle?: string;
        sectionType?: string;
    };
}

interface QuestionGroup {
    sectionTitle: string;
    sectionType: string;
    passage?: string;
    passageTranslation?: string;
    questions: ParsedQuestion[];
}

// Helper component for rendering questions list
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QuestionsList = ({
    groups,
    answers,
    onAnswerChange,
    showPassage = true,
    initialQuestionIndex = 0
}: {
    groups: QuestionGroup[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onAnswerChange: any,
    showPassage?: boolean,
    initialQuestionIndex?: number
}) => {
    let questionCounter = initialQuestionIndex;
    return (
        <div className="space-y-8 pb-20">
            {groups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <span className="px-3">{group.sectionTitle}</span>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </div>

                    {/* Passage (Only if showPassage is true) */}
                    {showPassage && group.passage && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-4">
                                <BookOpen className="w-4 h-4" />
                                <span>Đọc đoạn văn sau:</span>
                            </div>
                            <div className="text-sm text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-slate-100 prose prose-sm max-w-none [&_strong]:font-bold [&_em]:italic [&_p]:mb-2">
                                <ReactMarkdown>{group.passage || ''}</ReactMarkdown>
                            </div>
                            {group.passageTranslation && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="text-xs font-medium text-slate-500 mb-2">📖 Tạm dịch:</div>
                                    <div className="text-sm text-slate-600 italic leading-relaxed">
                                        {group.passageTranslation}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-4">
                        {group.questions.map((q) => {
                            const currentIndex = questionCounter++;
                            return (
                                <div
                                    key={q.id}
                                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition ${answers[q.id]
                                        ? "border-emerald-200"
                                        : "border-slate-200"
                                        }`}
                                >
                                    {/* Question Header */}
                                    <div className={`px-5 py-3 flex items-center justify-between border-b ${answers[q.id] ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${answers[q.id]
                                                ? "bg-emerald-500 text-white"
                                                : "bg-white text-slate-600 border border-slate-200"
                                                }`}>
                                                {answers[q.id] ? <CheckCircle className="w-4 h-4" /> : currentIndex + 1}
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
                                            />
                                        )}
                                        {q.type === "GAP_FILL" && (
                                            <GapFillQuestion
                                                question={q}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                value={answers[q.id] as Record<number, string>}
                                                onChange={(val) => onAnswerChange(q.id, val)}
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
                                        {q.type === "ESSAY" && (
                                            <EssayQuestion
                                                question={q}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                            />
                                        )}
                                        {!["MCQ", "GAP_FILL", "SORTABLE", "ESSAY", "ORDERING"].includes(q.type) && (
                                            <div className="bg-slate-50 p-4 rounded-lg">
                                                <p className="text-slate-600">{q.content}</p>
                                                <p className="mt-2 text-xs text-slate-400">[Loại câu hỏi chưa hỗ trợ: {q.type}]</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const QuizRunner = ({ assignment }: QuizRunnerProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Parse questions and group by section
    const groupedQuestions = useMemo(() => {
        const groups: QuestionGroup[] = [];
        let currentGroup: QuestionGroup | null = null;

        for (const q of assignment.questions) {
            let parsed;
            try {
                parsed = JSON.parse(q.content);
            } catch {
                parsed = { text: q.content, options: [] };
            }

            const sectionTitle = parsed.sectionTitle || "Câu hỏi";
            const sectionType = parsed.sectionType || "STANDALONE";

            // Check if we need a new group
            if (!currentGroup || currentGroup.sectionTitle !== sectionTitle) {
                currentGroup = {
                    sectionTitle,
                    sectionType,
                    passage: parsed.passage,
                    passageTranslation: parsed.passageTranslation,
                    questions: []
                };
                groups.push(currentGroup);
            }

            // Add question to current group (remove passage from individual question to avoid duplication)
            currentGroup.questions.push({
                ...q,
                parsed: {
                    ...parsed,
                    passage: undefined, // Will be shown at section level
                    passageTranslation: undefined
                }
            });
        }

        return groups;
    }, [assignment.questions]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    }

    const onSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/student/assignments/${assignment.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === "PENDING_GRADING") {
                    toast.success("Bài làm đã được nộp! Đang chờ giáo viên chấm điểm.");
                } else {
                    toast.success("Bài làm đã được nộp thành công!");
                }
                setIsSubmitted(true);
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
    const canSubmit = answeredCount >= totalQuestions && !isSubmitted;

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

    const SubmitButton = ({ className }: { className?: string }) => (
        <button
            onClick={onSubmit}
            disabled={isSubmitting}
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

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 -my-6 -mx-6 md:-my-8 md:-mx-8">
            {/* Header / Progress Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 z-20">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Tiến độ làm bài</span>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-indigo-600 font-semibold">
                                {answeredCount}/{totalQuestions} câu
                            </span>
                            <button
                                onClick={onSubmit}
                                disabled={isSubmitting}
                                className="hidden md:flex bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Nộp bài
                            </button>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Desktop Split View */}
            <div className="flex-1 hidden lg:block overflow-hidden relative">
                <ResizableSplitPane
                    left={
                        <div className="p-6 space-y-8 pb-20">
                            {/* Only render passages here */}
                            {groupedQuestions.map((group, i) => (
                                group.passage ? (
                                    <div key={i} className="scroll-mt-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                            <span>{group.sectionTitle}</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-3 border-b border-slate-100 pb-2">
                                                <BookOpen className="w-4 h-4" />
                                                <span>Đọc đoạn văn</span>
                                            </div>
                                            <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none [&_strong]:font-bold [&_em]:italic [&_p]:mb-2">
                                                <ReactMarkdown>{group.passage || ''}</ReactMarkdown>
                                            </div>
                                            {group.passageTranslation && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <div className="text-xs font-medium text-slate-500 mb-2">📖 Tạm dịch:</div>
                                                    <div className="text-sm text-slate-600 italic leading-relaxed">
                                                        {group.passageTranslation}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null
                            ))}
                            {/* Instruction if no passages */}
                            {!groupedQuestions.some(g => g.passage) && (
                                <div className="text-center text-slate-400 py-10 italic">
                                    Không có bài đọc cho phần này.
                                </div>
                            )}
                        </div>
                    }
                    right={
                        <div className="p-6">
                            <QuestionsList
                                groups={groupedQuestions}
                                answers={answers}
                                onAnswerChange={onAnswerChange}
                                showPassage={false} // Don't show passage on right side in Split View
                            />
                            {/* Submit Button (Bottom Right) */}
                            <div className="flex justify-end pt-4 pb-10">
                                <SubmitButton className="px-6 py-2.5 rounded-xl" />
                            </div>
                        </div>
                    }
                />
            </div>

            {/* Mobile Stacked View (Original Layout) */}
            <div className="flex-1 lg:hidden overflow-y-auto bg-slate-50 p-4">
                <QuestionsList
                    groups={groupedQuestions}
                    answers={answers}
                    onAnswerChange={onAnswerChange}
                    showPassage={true}
                />
                <div className="sticky bottom-4 left-0 right-0 mt-4 px-4 pb-4 bg-gradient-to-t from-slate-50 to-transparent">
                    <SubmitButton className="w-full px-6 py-3 rounded-xl" />
                </div>
            </div>
        </div>
    );
};

// Simplified MCQ component that uses pre-parsed content (no passage - shown at section level)
const McqQuestionSimple = ({
    question,
    value,
    onChange
}: {
    question: ParsedQuestion;
    value: string | undefined;
    onChange: (val: string) => void;
}) => {
    const { parsed } = question;

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
                <div className="text-base font-medium text-slate-900 [&>p]:inline [&>strong]:font-bold [&>em]:italic">
                    <ReactMarkdown>{displayData.text}</ReactMarkdown>
                </div>
            )}

            {/* Display Items for ORDERING questions */}
            {displayData.items.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="text-sm font-medium text-amber-700 mb-2">
                        📝 Các câu cần sắp xếp:
                    </div>
                    {displayData.items.map((item, index) => (
                        <div
                            key={index}
                            className="text-sm text-slate-700 pl-3 py-2 border-l-3 border-amber-400 bg-white rounded-r-lg px-3 shadow-sm"
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {/* Options */}
            {parsed.options && parsed.options.length > 0 && (
                <div className="flex flex-col space-y-2">
                    {parsed.options.map((option, index) => {
                        const optionValue = typeof option === 'string' ? option : option;
                        const isSelected = value === optionValue;

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => onChange(optionValue)}
                                className={`flex items-center space-x-3 border p-3 rounded-lg transition text-left ${isSelected
                                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                                    : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                                    }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                </div>
                                <span className={`flex-1 text-sm ${isSelected ? "text-indigo-700 font-medium" : "text-slate-700"}`}>
                                    {optionValue}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    );
};
