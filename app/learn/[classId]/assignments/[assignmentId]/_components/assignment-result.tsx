"use client";

import { CheckCircle, XCircle, FileText, Mic } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AssignmentResultProps {
    submissionResult: {
        score: number;
        totalScore: number;
        results: Record<string, {
            isCorrect: boolean;
            correctAnswer: string;
            feedback?: string;
            score?: number
        }>;
    };
    questions: any[];
}

export function AssignmentResult({ submissionResult, questions }: AssignmentResultProps) {
    const { score, totalScore, results } = submissionResult;
    const percentage = Math.round((score / totalScore) * 100);

    return (
        <div className="space-y-8">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 border-4 border-indigo-100">
                    <span className="text-3xl font-bold">{percentage}%</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Kết quả bài làm</h2>
                <div className="flex justify-center gap-6 text-sm text-slate-600">
                    <div className="flex flex-col items-center">
                        <span className="font-semibold text-slate-900 text-lg">{score}/{totalScore}</span>
                        <span>Điểm số</span>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                        {/* Count Correct (Approximation for MCQs) */}
                        <span className="font-semibold text-slate-900 text-lg">
                            {Object.values(results).filter(r => r.isCorrect).length}
                        </span>
                        <span>Câu đúng chính xác</span>
                    </div>
                </div>
            </div>

            {/* AI Grading & Feedback Review */}
            <div className="space-y-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Chi tiết đánh giá & Phản hồi AI
                </h3>

                {questions.filter(q => ["SPEAKING", "WRITING", "ESSAY"].includes(q.type)).map((q) => {
                    const result = results[q.id];
                    if (!result) return null;

                    const isSpeaking = q.type === "SPEAKING";
                    let contentText = "";
                    try {
                        const parsed = JSON.parse(q.content);
                        contentText = parsed.text;
                    } catch {
                        contentText = q.content;
                    }

                    return (
                        <div key={q.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${result.score ? "bg-indigo-100 border-indigo-200 text-indigo-600" : "bg-slate-100 text-slate-500"
                                        }`}>
                                        {isSpeaking ? <Mic className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                            {isSpeaking ? "Speaking" : "Writing"} Task
                                        </div>
                                        <div className="text-sm font-medium text-slate-900 line-clamp-1">{contentText}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-indigo-600">
                                        {result.score || 0}
                                        <span className="text-sm text-slate-400 font-normal">/{q.points}</span>
                                    </span>
                                    <span className="text-xs text-slate-500">Điểm AI chấm</span>
                                </div>
                            </div>

                            <div className="p-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">🤖 Nhận xét từ AI:</h4>
                                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-indigo">
                                    <ReactMarkdown>{result.feedback || "Không có nhận xét."}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {questions.filter(q => ["SPEAKING", "WRITING", "ESSAY"].includes(q.type)).length === 0 && (
                    <p className="text-slate-500 italic text-center py-8">Bài tập này không có phần tự luận được AI chấm điểm.</p>
                )}
            </div>

            {/* Action Buttons */}
            {/* Note: User usually wants to review MCQs too. But focusing on AI feedback first as requested. */}
        </div>
    );
}
