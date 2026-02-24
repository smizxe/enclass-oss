"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    FileText,
    PlusCircle,
    Save,
    Trash2,
    Loader2
} from "lucide-react";

interface Question {
    id: string;
    type: string;
    content: string;
    correctAnswer: string;
    points: number;
}

interface Assignment {
    id: string;
    title: string;
    type: string;
    content: string | null; // For Lecture content
}

export default function AssignmentEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [newQuestion, setNewQuestion] = useState<{
        text: string;
        options: string[];
        correctAnswerIndex: number | null;
    }>({
        text: "",
        options: ["", "", "", ""],
        correctAnswerIndex: null
    });

    const classId = params.id as string;
    const assignmentId = params.assignmentId as string;

    const fetchQuestions = async () => {
        try {
            const questionsRes = await axios.get(`/api/teacher/assignments/${assignmentId}/questions`);
            setQuestions(questionsRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [assignmentId]);

    const onAddQuestion = async () => {
        try {
            if (newQuestion.correctAnswerIndex === null) {
                toast.error("Vui lòng chọn đáp án đúng");
                return;
            }

            // Transform to simple JSON format for MVP
            const content = JSON.stringify({
                text: newQuestion.text,
                options: newQuestion.options
            });

            await axios.post(`/api/teacher/assignments/${assignmentId}/questions`, {
                type: "MCQ",
                content,
                correctAnswer: newQuestion.options[newQuestion.correctAnswerIndex],
                points: 10 // Default points
            });

            toast.success("Thêm câu hỏi thành công");
            setIsAddingQuestion(false);
            setNewQuestion({
                text: "",
                options: ["", "", "", ""],
                correctAnswerIndex: null
            });
            fetchQuestions();
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href={`/teacher/classes/${classId}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại lớp học
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Biên tập bài tập
                    </h1>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="text-center text-slate-500">
                    <p>Chức năng biên tập câu hỏi đang được phát triển...</p>
                    <p className="text-sm mt-2">Assignment ID: {assignmentId}</p>
                </div>

                {/* Questions List Logic Here */}
                <div className="mt-8 space-y-4">
                    {questions.map((q, idx) => {
                        let contentObj: any = {};
                        try {
                            contentObj = JSON.parse(q.content);
                        } catch {
                            contentObj = { text: q.content };
                        }

                        return (
                            <div key={q.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-700">Câu {idx + 1} ({q.type})</span>
                                    <div className="flex gap-2">
                                        <button className="text-slate-400 hover:text-red-500 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-slate-900 font-medium mb-3">{contentObj.text}</div>
                                {q.type === "MCQ" && contentObj.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {contentObj.options.map((opt: string, i: number) => (
                                            <div
                                                key={i}
                                                className={`p-2 rounded-lg border text-sm ${opt === q.correctAnswer
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-100 bg-slate-50 text-slate-600"
                                                    }`}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 text-xs text-slate-400">
                                    Điểm: {q.points} | Đáp án đúng: {q.correctAnswer}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Question Button */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => {
                            // Logic to open modal (to be implemented efficiently without full modal code here first, sticking to simple prompt or separate component)
                            // For MVP, I'll implement a simple form below toggled by state
                            setIsAddingQuestion(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Thêm câu hỏi
                    </button>
                </div>

                {/* Add Question Form (Inline for MVP) */}
                {isAddingQuestion && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Thêm câu hỏi trắc nghiệm</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                onAddQuestion();
                            }}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Câu hỏi</label>
                                        <textarea
                                            value={newQuestion.text}
                                            onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows={2}
                                            placeholder="Nhập nội dung câu hỏi..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Các lựa chọn</label>
                                        {newQuestion.options.map((opt, i) => (
                                            <div key={i} className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOptions = [...newQuestion.options];
                                                        newOptions[i] = e.target.value;
                                                        setNewQuestion({ ...newQuestion, options: newOptions });
                                                    }}
                                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                    placeholder={`Lựa chọn ${i + 1}`}
                                                    required
                                                />
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={newQuestion.correctAnswerIndex === i}
                                                    onChange={() => setNewQuestion({ ...newQuestion, correctAnswerIndex: i })}
                                                    className="w-5 h-5 mt-2.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingQuestion(false)}
                                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Lưu câu hỏi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// NOTE: This is a scaffold. I need to fully implement the question editors (MCQ, GapFill) here.
