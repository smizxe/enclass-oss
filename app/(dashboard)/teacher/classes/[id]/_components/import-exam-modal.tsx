"use client";

import { useState } from "react";
import { Upload, FileText, X, Loader2, Check, AlertCircle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Question {
    questionNumber?: number;
    type: string;
    content: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string | null;
}

interface Section {
    title: string;
    type: string;
    passage?: string | null;
    passageTranslation?: string | null;
    questions: Question[];
}

interface ImportExamModalProps {
    classId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ImportExamModal = ({ classId, onClose, onSuccess }: ImportExamModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [step, setStep] = useState<"upload" | "preview" | "saving">("upload");
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
    const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith(".docx")) {
                setError("Chỉ hỗ trợ file .docx");
                return;
            }
            setFile(selectedFile);
            setError("");
            setTitle(selectedFile.name.replace(".docx", ""));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(`/api/teacher/classes/${classId}/import`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const data = response.data;

            // Handle both section-based output and legacy flat array
            if (data.sections && Array.isArray(data.sections)) {
                setSections(data.sections);
            } else if (Array.isArray(data)) {
                // Legacy flat array - convert to single section
                setSections([{
                    title: "Câu hỏi",
                    type: "STANDALONE",
                    passage: null,
                    passageTranslation: null,
                    questions: data.map((q: Question, i: number) => ({
                        ...q,
                        questionNumber: i + 1
                    }))
                }]);
            } else {
                setSections([]);
            }
            setStep("preview");
        } catch (err: unknown) {
            console.error(err);
            const errorMsg = (err as { response?: { data?: string } })?.response?.data;
            setError(errorMsg || "Lỗi khi phân tích file. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Vui lòng nhập tiêu đề bài tập");
            return;
        }

        setStep("saving");
        setIsLoading(true);

        try {
            await axios.post(`/api/teacher/classes/${classId}/import/save`, {
                title,
                sections,
            });

            toast.success("Import thành công!");
            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error(err);
            const errorMsg = (err as { response?: { data?: string } })?.response?.data;
            setError(errorMsg || "Lỗi khi lưu bài tập");
            setStep("preview");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (index: number) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const toggleExplanation = (key: string) => {
        setExpandedExplanations((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-xl font-bold text-slate-900">
                        {step === "upload" && "Import đề thi từ file Word"}
                        {step === "preview" && "Xem trước và chỉnh sửa"}
                        {step === "saving" && "Đang lưu..."}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {step === "upload" && (
                        <div className="space-y-4">
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${file ? "border-indigo-300 bg-indigo-50" : "border-slate-300 hover:border-indigo-400"}`}
                            >
                                <input type="file" accept=".docx" onChange={handleFileChange} className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-10 h-10 text-indigo-600" />
                                            <div className="text-left">
                                                <p className="font-medium text-slate-900">{file.name}</p>
                                                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                            <p className="text-slate-600 font-medium">Kéo thả file hoặc click để chọn</p>
                                            <p className="text-sm text-slate-400 mt-1">Hỗ trợ file .docx (Word) - Đề thi TNPT</p>
                                        </>
                                    )}
                                </label>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-medium text-slate-700 mb-2">Hướng dẫn</h3>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• Hỗ trợ định dạng đề thi TNPT (THPT Quốc gia)</li>
                                    <li>• AI sẽ tự động nhận diện các phần (Reading, Gap Fill...)</li>
                                    <li>• Bài đọc chung sẽ được nhóm với các câu hỏi liên quan</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề bài tập</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Nhập tiêu đề..."
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">
                                    <span className="font-bold text-indigo-600">{sections.length}</span> phần,{" "}
                                    <span className="font-bold text-indigo-600">{totalQuestions}</span> câu hỏi
                                </span>
                            </div>

                            <div className="space-y-4 max-h-[450px] overflow-y-auto">
                                {sections.map((section, sIndex) => (
                                    <div key={sIndex} className="border border-slate-200 rounded-xl overflow-hidden">
                                        {/* Section Header */}
                                        <button
                                            onClick={() => toggleSection(sIndex)}
                                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                                    {section.type}
                                                </span>
                                                <span className="font-medium text-slate-900">{section.title}</span>
                                                <span className="text-xs text-slate-500">({section.questions.length} câu)</span>
                                            </div>
                                            {expandedSections.has(sIndex) ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>

                                        {expandedSections.has(sIndex) && (
                                            <div className="p-4 space-y-4">
                                                {/* Passage */}
                                                {section.passage && (
                                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                                                            <BookOpen className="w-4 h-4" />
                                                            Đoạn văn chung
                                                        </div>
                                                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                            {section.passage}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Questions */}
                                                <div className="space-y-3">
                                                    {section.questions.map((q, qIndex) => {
                                                        const expKey = `${sIndex}-${qIndex}`;
                                                        return (
                                                            <div key={qIndex} className="p-3 bg-white border border-slate-200 rounded-lg">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                                                                        Câu {q.questionNumber || qIndex + 1}
                                                                    </span>
                                                                    {q.correctAnswer && (
                                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                                            Đáp án: {q.correctAnswer}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {q.content && (
                                                                    <p className="mt-2 text-sm text-slate-800">{q.content}</p>
                                                                )}
                                                                {q.options && q.options.length > 0 && (
                                                                    <div className="mt-2 grid grid-cols-2 gap-1">
                                                                        {q.options.map((opt, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className={`text-sm px-2 py-1 rounded ${q.correctAnswer === String.fromCharCode(65 + i)
                                                                                    ? "bg-green-100 text-green-800 font-medium"
                                                                                    : "bg-slate-50 text-slate-600"
                                                                                    }`}
                                                                            >
                                                                                {String.fromCharCode(65 + i)}. {opt}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {q.explanation && (
                                                                    <div className="mt-2">
                                                                        <button
                                                                            onClick={() => toggleExplanation(expKey)}
                                                                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                                        >
                                                                            {expandedExplanations.has(expKey) ? (
                                                                                <><ChevronUp className="w-3 h-3" /> Ẩn lời giải</>
                                                                            ) : (
                                                                                <><ChevronDown className="w-3 h-3" /> Xem lời giải</>
                                                                            )}
                                                                        </button>
                                                                        {expandedExplanations.has(expKey) && (
                                                                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 whitespace-pre-wrap">
                                                                                {q.explanation}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "saving" && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-slate-600">Đang lưu bài tập...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                    {step === "upload" && (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                Hủy
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || isLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích...</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> Phân tích bằng AI</>
                                )}
                            </button>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            <button onClick={() => setStep("upload")} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                Quay lại
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={totalQuestions === 0 || isLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition"
                            >
                                <Check className="w-4 h-4" />
                                Lưu {totalQuestions} câu hỏi
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
