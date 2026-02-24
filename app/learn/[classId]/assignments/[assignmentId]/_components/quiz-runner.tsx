"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, Send, Loader2 } from "lucide-react";

import { McqQuestion } from "@/components/questions/mcq-question";
import { GapFillQuestion } from "@/components/questions/gap-fill-question";
import { SortableQuestion } from "@/components/questions/sortable-question";

interface QuizRunnerProps {
    assignment: {
        id: string;
        title: string;
        type: string;
        questions: any[];
    };
}

export const QuizRunner = ({ assignment }: QuizRunnerProps) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const onAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    }

    const onSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Submitting answers:", answers);
        toast.success("Bài làm đã được nộp thành công!");
        setIsSubmitted(true);
        setIsSubmitting(false);
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

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Tiến độ làm bài</span>
                    <span className="text-sm text-indigo-600 font-semibold">
                        {answeredCount}/{totalQuestions} câu
                    </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                {assignment.questions.map((q: any, i: number) => (
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
                                    {answers[q.id] ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                    Câu hỏi {i + 1}
                                </span>
                            </div>
                            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
                                {q.points} điểm
                            </span>
                        </div>

                        {/* Question Content */}
                        <div className="p-5">
                            {q.type === "MCQ" && (
                                <McqQuestion
                                    question={q}
                                    value={answers[q.id] as string}
                                    onChange={(val) => onAnswerChange(q.id, val)}
                                />
                            )}
                            {q.type === "GAP_FILL" && (
                                <GapFillQuestion
                                    question={q}
                                    value={answers[q.id] as Record<number, string>}
                                    onChange={(val) => onAnswerChange(q.id, val)}
                                />
                            )}
                            {q.type === "SORTABLE" && (
                                <SortableQuestion
                                    question={q}
                                    value={answers[q.id] as string[]}
                                    onChange={(val) => onAnswerChange(q.id, val)}
                                />
                            )}
                            {!["MCQ", "GAP_FILL", "SORTABLE"].includes(q.type) && (
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-slate-600">{q.content}</p>
                                    <p className="mt-2 text-xs text-slate-400">[Loại câu hỏi chưa hỗ trợ: {q.type}]</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
                {isSubmitted ? (
                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 font-medium rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                        Đã nộp bài thành công
                    </div>
                ) : (
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit || isSubmitting}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/25"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Nộp bài
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
