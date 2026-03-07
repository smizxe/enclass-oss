"use client";

import { CheckCircle, XCircle, FileText, Mic } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AssignmentResultProps {
    submissionResult: {
        score: number;
        totalScore: number;
        rawEarnedScore?: number;
        rawTotalScore?: number;
        results: Record<string, {
            isCorrect: boolean;
            correctAnswer: string;
            feedback?: string;
            score?: number;
            isPendingAi?: boolean;
        }>;
    };
    questions: any[];
    streamingFeedback?: Record<string, { text: string; isStreaming: boolean; score?: number; isError?: boolean; errorMessage?: string }>;
    onRetryAiGrading?: () => void;
}

export function AssignmentResult({ submissionResult, questions, streamingFeedback = {}, onRetryAiGrading }: AssignmentResultProps) {
    const { score, totalScore, rawEarnedScore, rawTotalScore, results } = submissionResult;
    const percentage = Math.round((score / totalScore) * 100);

    // Number of correct answers (fallback to 0)
    const countCorrect = Object.values(results).filter(r => r.isCorrect).length;
    const totalQuestionsCount = Object.keys(results).length;

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
                        <span className="font-semibold text-slate-900 text-lg">
                            {Number.isInteger(score) ? score : score.toFixed(2)} / 10
                        </span>
                        <span>Điểm số</span>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="font-semibold text-slate-900 text-lg">
                            {countCorrect} / {totalQuestionsCount}
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

                    const streamState = streamingFeedback[q.id];
                    const displayScore = streamState?.score !== undefined ? streamState.score : result.score;
                    const isPending = result.isPendingAi && !streamState?.text;
                    const isStreaming = streamState?.isStreaming;
                    const isError = streamState?.isError;

                    return (
                        <div key={q.id} className={`bg-white rounded-xl border ${isError ? "border-red-200" : "border-slate-200"} overflow-hidden shadow-sm`}>
                            <div className={`${isError ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"} border-b p-4 flex items-start justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isError ? "bg-red-100 border-red-200 text-red-600" :
                                            displayScore ? "bg-indigo-100 border-indigo-200 text-indigo-600" :
                                                "bg-slate-100 text-slate-500"
                                        }`}>
                                        {isSpeaking ? <Mic className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className={`text-xs font-bold ${isError ? "text-red-500" : "text-slate-500"} uppercase tracking-wider mb-1`}>
                                            {isSpeaking ? "Speaking" : "Writing"} Task
                                        </div>
                                        <div className="text-sm font-medium text-slate-900 line-clamp-1">{contentText}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {isError ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-red-500 font-medium font-bold mt-1">⚠️ Lỗi máy chủ</span>
                                        </div>
                                    ) : isPending || isStreaming ? (
                                        <div className="flex flex-col items-end">
                                            <div className="w-12 h-6 bg-slate-200 animate-pulse rounded"></div>
                                            <span className="text-xs text-indigo-500 font-medium mt-1 animate-pulse">AI đang chấm...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="block text-2xl font-bold text-indigo-600">
                                                {displayScore || 0}
                                                <span className="text-sm text-slate-400 font-normal">/{q.points}</span>
                                            </span>
                                            <span className="text-xs text-slate-500">Điểm AI chấm</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-slate-700">
                                        🤖 Nhận xét từ AI:
                                        {(isPending || isStreaming) && !isError && <span className="ml-2 inline-block w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin align-middle"></span>}
                                        {isError && <span className="ml-2 text-red-500">❌ Kết nối thất bại</span>}
                                    </h4>

                                    {isError && onRetryAiGrading && (
                                        <button
                                            onClick={onRetryAiGrading}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-md text-xs transition duration-200 flex items-center gap-1.5 shadow-sm border border-red-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Thử chấm lại
                                        </button>
                                    )}
                                </div>
                                <div className={`${isError ? "bg-red-50 border-red-100" : "bg-indigo-50/50 border-indigo-100"} rounded-xl p-4 border text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-indigo`}>
                                    {isPending ? (
                                        isError ? (
                                            <div className="text-red-600 space-y-1">
                                                <p className="font-medium">Hệ thống AI hiện thời đang quá tải hoặc gặp lỗi. Vui lòng nhấn nút thử lại.</p>
                                                <p className="text-xs text-red-500/80">{streamState?.errorMessage || "Chi tiết kết nối thất bại"}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-3/4 h-4 bg-slate-200 animate-pulse rounded"></div>
                                                <div className="w-1/2 h-4 bg-slate-200 animate-pulse rounded"></div>
                                            </div>
                                        )
                                    ) : (
                                        <div>
                                            <ReactMarkdown>{streamState?.text || result.feedback || "Không có nhận xét."}</ReactMarkdown>
                                            {isStreaming && <span className="inline-block w-2 bg-indigo-500 h-4 ml-1 animate-pulse align-middle"></span>}
                                        </div>
                                    )}
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
