"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { CheckCircle, Send, Loader2, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
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

// Helper component for rendering questions list for a SINGLE section
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SectionContent = ({
    group,
    answers,
    onAnswerChange,
    showPassage = true,
    startIndex,
    submissionResult
}: {
    group: QuestionGroup,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onAnswerChange: any,
    showPassage?: boolean,
    startIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submissionResult?: any
}) => {
    let questionCounter = startIndex;
    return (
        <div className="space-y-8 pb-10">
            <div className="space-y-4">
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
                                            result={result}
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
        </div>
    );
};

export const QuizRunner = ({ assignment }: QuizRunnerProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [submissionResult, setSubmissionResult] = useState<any>(null);

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
                body: JSON.stringify({ answers })
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

    // Auto-scroll to top when section changes
    useEffect(() => {
        const splitLeft = document.getElementById('split-left');
        const splitRight = document.getElementById('split-right');
        const mobileContainer = document.getElementById('mobile-container');

        if (splitLeft) splitLeft.scrollTop = 0;
        if (splitRight) splitRight.scrollTop = 0;
        if (mobileContainer) mobileContainer.scrollTop = 0;
    }, [activeSectionIndex]);

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

        return (
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

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 -my-6 -mx-6 md:-my-8 md:-mx-8">
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

                        {/* Submit Button (Header - always visible on desktop) */}
                        {!isSubmitted ? (
                            <button
                                onClick={onSubmit}
                                disabled={isSubmitting}
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

                    {/* Section Selector */}
                    <SectionSelector />
                </div>
            </div>

            {/* Desktop Split View */}
            <div className="flex-1 hidden lg:block overflow-hidden relative">
                <ResizableSplitPane
                    // Passage Pane (Left)
                    left={
                        <div id="split-left" className="h-full overflow-y-auto p-6 space-y-8 pb-20 scroll-smooth">
                            {activeGroup.passage ? (
                                <div className="scroll-mt-4 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                        <span>{activeGroup.sectionTitle}</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-3 border-b border-slate-100 pb-2">
                                            <BookOpen className="w-4 h-4" />
                                            <span>Đọc đoạn văn</span>
                                        </div>
                                        <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none [&_strong]:font-bold [&_em]:italic [&_p]:mb-2">
                                            <ReactMarkdown>{activeGroup.passage || ''}</ReactMarkdown>
                                        </div>
                                        {activeGroup.passageTranslation && (
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <div className="text-xs font-medium text-slate-500 mb-2">📖 Tạm dịch:</div>
                                                <div className="text-sm text-slate-600 italic leading-relaxed">
                                                    {activeGroup.passageTranslation}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 italic">
                                    <div className="text-center">
                                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Phần này không có bài đọc</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    // Questions Pane (Right)
                    right={
                        <div id="split-right" className="h-full overflow-y-auto w-full p-6 flex flex-col scroll-smooth">
                            <div className="flex-1 animate-in slide-in-from-right-4 duration-300">
                                <SectionContent
                                    group={activeGroup}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    showPassage={false} // Don't show passage on right side in Split View
                                    startIndex={currentSectionStartIndex}
                                    submissionResult={submissionResult}
                                />
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
                    />
                </div>

                <div className="mt-6 pb-20">
                    <NavigationControls />
                </div>
            </div>
        </div>
    );
};

// Simplified MCQ component that uses pre-parsed content (no passage - shown at section level)
const McqQuestionSimple = ({
    question,
    value,
    onChange,
    result
}: {
    question: ParsedQuestion;
    value: string | undefined;
    onChange: (val: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result?: any
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

                        // Result Styling
                        let resultClass = "";
                        let disabled = false;
                        let isCorrectAnswer = false;

                        if (result) {
                            disabled = true;
                            const optionLetter = String.fromCharCode(65 + index);
                            isCorrectAnswer = (optionValue === result.correctAnswer || result.correctAnswer === optionLetter);

                            if (isCorrectAnswer) {
                                // Correct Answer (always highlighted)
                                resultClass = "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200 text-emerald-800";
                            } else if (isSelected && !result.isCorrect) {
                                // Selected but Wrong
                                resultClass = "border-red-500 bg-red-100 ring-2 ring-red-200 text-red-800";
                            } else if (isSelected && result.isCorrect) {
                                // Selected and Correct (already handled by first case, but valid for clarity)
                                resultClass = "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200 text-emerald-800";
                            } else {
                                // Not selected, plain
                                resultClass = "opacity-60";
                            }
                        }

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => !disabled && onChange(optionValue)}
                                disabled={disabled}
                                className={`flex items-center space-x-3 border p-3 rounded-lg transition text-left ${resultClass
                                    ? resultClass
                                    : (isSelected
                                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                                        : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                    )
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${result
                                    ? (optionValue === result.correctAnswer ? "border-emerald-500 bg-emerald-500" : (isSelected ? "border-red-500 bg-red-500" : "border-slate-300"))
                                    : (isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-300")
                                    }`}>
                                    {((isSelected && !result) || (result && (isCorrectAnswer || isSelected))) && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                </div>
                                <span className={`flex-1 text-sm ${isSelected && !result ? "text-indigo-700 font-medium" : "text-slate-700"}`}>
                                    {optionValue}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Explanation / Result Text */}
            {result && (
                <div className={`mt-3 text-sm p-3 rounded-lg ${result.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    <span className="font-bold">{result.isCorrect ? "Chính xác!" : "Chưa chính xác!"}</span>
                    {!result.isCorrect && (
                        <span className="ml-2">Đáp án đúng: <strong>{result.correctAnswer}</strong></span>
                    )}
                </div>
            )}
        </div>
    );
};
