"use client";

import { useState } from "react";
import { Upload, FileText, X, Loader2, Check, AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Question {
    type: string;
    content: string;
    options?: string[];
    correctAnswer?: string;
}

interface ImportExamModalProps {
    classId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ImportExamModal = ({ classId, onClose, onSuccess }: ImportExamModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [step, setStep] = useState<"upload" | "preview" | "saving">("upload");
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith(".docx")) {
                setError("Chỉ hỗ trợ file .docx");
                return;
            }
            setFile(selectedFile);
            setError("");
            // Auto-set title from filename
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

            setQuestions(response.data);
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
                questions,
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

    const removeQuestion = (index: number) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };



    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-xl font-bold text-slate-900">
                        {step === "upload" && "Import đề thi từ file Word"}
                        {step === "preview" && "Xem trước và chỉnh sửa"}
                        {step === "saving" && "Đang lưu..."}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
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
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${file ? "border-indigo-300 bg-indigo-50" : "border-slate-300 hover:border-indigo-400"
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-10 h-10 text-indigo-600" />
                                            <div className="text-left">
                                                <p className="font-medium text-slate-900">{file.name}</p>
                                                <p className="text-sm text-slate-500">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                            <p className="text-slate-600 font-medium">
                                                Kéo thả file hoặc click để chọn
                                            </p>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Hỗ trợ file .docx (Word)
                                            </p>
                                        </>
                                    )}
                                </label>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-medium text-slate-700 mb-2">Hướng dẫn</h3>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• File Word nên có định dạng câu hỏi rõ ràng</li>
                                    <li>• AI sẽ tự động nhận diện câu trắc nghiệm (A, B, C, D) và tự luận</li>
                                    <li>• Bạn có thể chỉnh sửa sau khi AI phân tích xong</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Tiêu đề bài tập
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Nhập tiêu đề..."
                                />
                            </div>

                            <div className="text-sm text-slate-600">
                                Đã tìm thấy <span className="font-bold text-indigo-600">{questions.length}</span> câu hỏi
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {questions.map((q, index) => (
                                    <div
                                        key={index}
                                        className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                                        {q.type}
                                                    </span>
                                                    <span className="text-xs text-slate-500">Câu {index + 1}</span>
                                                </div>
                                                <p className="text-slate-900 whitespace-pre-wrap text-sm">
                                                    {q.content}
                                                </p>
                                                {q.options && q.options.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {q.options.map((opt, i) => (
                                                            <div
                                                                key={i}
                                                                className={`text-sm px-3 py-1.5 rounded ${q.correctAnswer && opt.includes(q.correctAnswer)
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-white text-slate-600"
                                                                    }`}
                                                            >
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeQuestion(index)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
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
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || isLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang phân tích...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Phân tích bằng AI
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            <button
                                onClick={() => setStep("upload")}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={questions.length === 0 || isLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                                <Check className="w-4 h-4" />
                                Lưu {questions.length} câu hỏi
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
