"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import {
    ArrowLeft,
    PlusCircle,
    Trash2,
    Loader2,
    BookOpen,
    Pencil,
    Upload,
    Sparkles,
    FileText
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AudioManager } from "@/components/audio-manager";
import { Editor } from "@/components/editor";

interface Question {
    id: string;
    type: string;
    content: string;
    correctAnswer: string;
    points: number;
}

interface ParsedContent {
    text: string;
    items?: string[];
    options?: string[];
    passage?: string;
    passageTable?: string;
    passageTranslation?: string;
    sectionTitle?: string;
    sectionType?: string;
    sectionAudio?: string;
}

interface QuestionGroup {
    sectionTitle: string;
    sectionType: string;
    sectionAudio?: string;
    passage?: string;
    passageTable?: string;
    passageTranslation?: string;
    questions: (Question & { parsed: ParsedContent })[];
}

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    type: "MCQ" | "ESSAY" | "MIXED";
    settings: any;
}

export default function AssignmentEditorPage() {
    const params = useParams();
    const id = params?.id as string; // classId
    const assignmentId = params?.assignmentId as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit Question Modal State
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [newQuestion, setNewQuestion] = useState<{
        type: string;
        text: string;
        options: string[];
        correctAnswerIndexes: number[];
        correctAnswerText: string;
        points: number;
    }>({
        type: "MCQ",
        text: "",
        options: ["", "", "", ""],
        correctAnswerIndexes: [],
        correctAnswerText: "",
        points: 1
    });

    // Essay Prompt State
    const [essayPrompt, setEssayPrompt] = useState("");

    // Section Management State
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [newSectionType, setNewSectionType] = useState("MCQ");

    // Editor Mode State
    const [inputType, setInputType] = useState<"RICH" | "HTML">("RICH");

    // Edit Section Modal State (For Passage/Translation)
    const [editingSection, setEditingSection] = useState<{
        questionIds: string[];
        sectionTitle: string;
        sectionAudio?: string;
        passage: string;
        passageTable: string;
        passageTranslation: string;
    } | null>(null);

    const classId = id;

    const fetchQuestions = useCallback(async () => {
        try {
            const res = await axios.get(`/api/teacher/assignments/${assignmentId}/questions`);
            setQuestions(res.data);

            // Check for essay prompt (usually stored as a single question or in settings)
            // For MVP: If type is ESSAY, we might store prompt in description or a specific question
            // Here we assume standard questions fetch
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải câu hỏi");
        }
    }, [assignmentId]);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await axios.get(`/api/teacher/assignments/${assignmentId}`);
                setAssignment(res.data);
                if (res.data.type === "ESSAY" && res.data.description) {
                    setEssayPrompt(res.data.description);
                }
            } catch (error) {
                console.error(error);
                toast.error("Lỗi tải thông tin bài tập");
            } finally {
                setLoading(false);
            }
        };

        fetchAssignment();
        fetchQuestions();
    }, [assignmentId, fetchQuestions]);

    // Group questions by Section
    const groupedQuestions = useMemo(() => {
        const groups: QuestionGroup[] = [];
        let currentGroup: QuestionGroup | null = null;

        // Sort questions by order (if we had an order field) or just index
        // Assuming API returns in creation order or we trust the array order

        questions.forEach((q) => {
            let parsed: ParsedContent;
            try {
                parsed = JSON.parse(q.content);
            } catch {
                parsed = { text: q.content };
            }

            const qWithParsed = { ...q, parsed };
            const sectionTitle = parsed.sectionTitle || "General";
            const sectionType = parsed.sectionType || "MCQ";

            if (q.type === "SECTION_HEADER") {
                // Warning: Explicit section header question type is used to break sections
                // It might not be a real question.
                // Or if we encounter a new sectionTitle in a normal question, we start a new group?
                // Let's rely on consistent sectionTitle for now.
            }

            // Simple grouping logic:
            // If sectionTitle changes from the previous one, start a new group.
            // OR if it's the first question.

            if (!currentGroup || currentGroup.sectionTitle !== sectionTitle) {
                // Push old group
                if (currentGroup) groups.push(currentGroup);

                // Start new group
                currentGroup = {
                    sectionTitle,
                    sectionType,
                    sectionAudio: parsed.sectionAudio,
                    passage: parsed.passage,
                    passageTranslation: parsed.passageTranslation,
                    questions: []
                };
            }

            // Sync Passage Info if the current question has passage info and the group doesn't (or update it)
            // Usually the first question carries the passage info, or all of them do.
            if (parsed.passage && !currentGroup.passage) currentGroup.passage = parsed.passage;
            if (parsed.passageTranslation && !currentGroup.passageTranslation) currentGroup.passageTranslation = parsed.passageTranslation;
            // Sync Audio
            if (parsed.sectionAudio && !currentGroup.sectionAudio) currentGroup.sectionAudio = parsed.sectionAudio;

            currentGroup.questions.push(qWithParsed);
        });

        if (currentGroup) groups.push(currentGroup);

        return groups;
    }, [questions]);


    // Handlers
    const handleDeleteQuestion = async (qId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
        try {
            await axios.delete(`/api/teacher/assignments/${assignmentId}/questions/${qId}`);
            toast.success("Đã xóa câu hỏi");
            fetchQuestions();
        } catch {
            toast.error("Lỗi xóa câu hỏi");
        }
    };

    const handleEditQuestion = (q: Question & { parsed: ParsedContent }) => {
        setEditingQuestionId(q.id);
        const parsed = q.parsed;

        // Handle Options loading (Robust check for Object vs String)
        let options: string[] = ["", "", "", ""];
        if (parsed.options && Array.isArray(parsed.options) && parsed.options.length > 0) {
            options = parsed.options.map((opt: any) => typeof opt === 'string' ? opt : opt.text || "");
            // Ensure at least 4 options for consistency in editor, or match length
            if (options.length < 4) {
                options = [...options, ...Array(4 - options.length).fill("")];
            }
        }

        // Parse correct answers (e.g. "A" or "A, C")
        let indexes: number[] = [];
        let answerText = "";

        if (q.correctAnswer) {
            // If MCQ, try to parse indices
            if (q.type === "MCQ") {
                indexes = q.correctAnswer.split(",").map(s => s.trim()).map(char => char.charCodeAt(0) - 65).filter(idx => idx >= 0);
            }
            answerText = q.correctAnswer;
        }

        setNewQuestion({
            type: q.type,
            text: parsed.text,
            options: options,
            correctAnswerIndexes: indexes,
            correctAnswerText: answerText,
            points: q.points
        });
        setIsAddingQuestion(true);
    };

    const onSaveQuestion = async () => {
        // Validation logic...
        // For MVP assuming good input or basic check
        if (!newQuestion.text) return toast.error("Vui lòng nhập nội dung câu hỏi");

        const contentObj = {
            text: newQuestion.text,
            options: newQuestion.options,
            // Preserve section info if editing, or use current section context if adding?
            // For now, simpler implementation:
            // If adding new, we need to know which section.
            // MVP: Add to "General" or last section.
            sectionTitle: "General"
        };

        let correctAnswerChar = "";
        if (newQuestion.type === "MCQ") {
            correctAnswerChar = newQuestion.correctAnswerIndexes.length > 0
                ? newQuestion.correctAnswerIndexes.sort((a, b) => a - b).map(idx => String.fromCharCode(65 + idx)).join(",")
                : "";
        } else {
            // For GAP_FILL etc., use the text input
            correctAnswerChar = newQuestion.correctAnswerText;
        }

        const data = {
            type: newQuestion.type, // Use selected type
            content: JSON.stringify(contentObj),
            correctAnswer: correctAnswerChar,
            points: newQuestion.points
        };

        try {
            if (editingQuestionId) {
                // Need to merge with existing content to preserve sectionTitle etc.
                const existingQ = questions.find(q => q.id === editingQuestionId);
                let existingContent = {};
                try { existingContent = JSON.parse(existingQ?.content || "{}"); } catch { }

                const mergedContent = { ...existingContent, ...contentObj };

                await axios.patch(`/api/teacher/assignments/${assignmentId}/questions/${editingQuestionId}`, {
                    ...data,
                    content: JSON.stringify(mergedContent)
                });
                toast.success("Đã cập nhật câu hỏi");
            } else {
                await axios.post(`/api/teacher/assignments/${assignmentId}/questions`, data);
                toast.success("Thêm câu hỏi thành công");
            }

            setIsAddingQuestion(false);
            setEditingQuestionId(null);
            setNewQuestion({
                type: "MCQ",
                text: "",
                options: ["", "", "", ""],
                correctAnswerIndexes: [],
                correctAnswerText: "",
                points: 1
            });
            setEssayPrompt("");
            fetchQuestions();
        } catch {
            toast.error("Có lỗi xảy ra");
        }
    };

    const handleEditSection = (group: QuestionGroup) => {
        const questionIds = group.questions.map(q => q.id);

        // Default to RICH mode for text editing
        setInputType("RICH");

        setEditingSection({
            questionIds,
            sectionTitle: group.sectionTitle,
            sectionAudio: group.sectionAudio,
            passage: group.passage || "",
            passageTable: group.passageTable || "",
            passageTranslation: group.passageTranslation || ""
        });
    };

    const onSaveSection = async () => {
        if (!editingSection) return;

        try {
            await axios.patch(`/api/teacher/assignments/${assignmentId}/sections`, editingSection);
            toast.success("Đã cập nhật phần thi");
            setEditingSection(null);
            fetchQuestions();
        } catch {
            toast.error("Không thể cập nhật phần thi");
        }
    };

    const onUpdateSettings = async (newSettings: any) => {
        try {
            await axios.patch(`/api/teacher/assignments/${assignmentId}`, {
                settings: newSettings
            });
            setAssignment(prev => prev ? { ...prev, settings: newSettings } : null);
            toast.success("Cập nhật cài đặt thành công");
        } catch {
            toast.error("Lỗi khi lưu cài đặt");
        }
    };

    const handleCreateSection = async () => {
        // Create a placeholder question to establish the section
        try {
            const data = {
                type: "SECTION_HEADER", // Special type, filtered out in runner
                content: JSON.stringify({
                    sectionTitle: newSectionTitle,
                    sectionType: newSectionType,
                    text: "Section Header",
                    items: [],
                    options: []
                }),
                correctAnswer: "",
                points: 0
            };
            await axios.post(`/api/teacher/assignments/${assignmentId}/questions`, data);
            toast.success("Đã tạo phần thi mới");
            setIsAddingSection(false);
            setNewSectionTitle("");
            fetchQuestions();
        } catch {
            toast.error("Lỗi khi tạo phần thi");
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
                        {assignment?.title || "Biên tập bài tập"}
                    </h1>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="text-center text-slate-500">
                    <p>Chức năng biên tập câu hỏi đang được phát triển...</p>
                    <p className="text-sm mt-2">Assignment ID: {assignmentId}</p>
                </div>

                {/* Audio Manager */}
                <AudioManager
                    assignmentId={assignmentId}
                    settings={assignment?.settings || null}
                    onUpdateSettings={onUpdateSettings}
                    label="Audio Chung (Global)"
                    description="Áp dụng cho toàn bộ bài thi nếu không có audio riêng từng phần"
                />

                {/* Questions List grouped by Section */}
                <div className="mt-8 space-y-6">
                    {groupedQuestions.map((group, groupIndex) => {
                        let questionCounter = groupedQuestions
                            .slice(0, groupIndex)
                            .reduce((acc, g) => acc + g.questions.length, 0);

                        return (
                            <div key={groupIndex} className="space-y-4">
                                {/* Section Header */}
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                    <span className="px-3 bg-indigo-50 text-indigo-600 rounded-full py-1">
                                        {group.sectionTitle}
                                    </span>
                                    {group.passage ? (
                                        <button
                                            onClick={() => handleEditSection(group)}
                                            className="ml-2 text-slate-400 hover:text-indigo-600 transition"
                                            title="Sửa đoạn văn/tiêu đề"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleEditSection(group)}
                                            className="ml-2 flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Sửa / Thêm nội dung
                                        </button>
                                    )}
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                </div>

                                {/* Section Passage (shown once for the group) */}
                                {/* Section Passage (shown once for the group) */}
                                {(group.passage || group.passageTable) && (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-4">
                                            <BookOpen className="w-4 h-4" />
                                            <span>Đoạn văn chung / Dữ liệu bài:</span>
                                        </div>

                                        {/* Render Passage (Text or Merged HTML) */}
                                        {group.passage && (
                                            <div className="text-sm text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-blue-100 prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2">
                                                {/* If passage looks like HTML (contains table or tags), render directly. Otherwise Markdown. */}
                                                {(group.passage.includes("<table") || group.passage.includes("<p>")) ? (
                                                    <div dangerouslySetInnerHTML={{ __html: group.passage }} />
                                                ) : (
                                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                                        {group.passage}
                                                    </ReactMarkdown>
                                                )}
                                            </div>
                                        )}

                                        {/* Render Passage Table (Separate Field - If Exists) */}
                                        {group.passageTable && (
                                            <div className="mt-4 text-sm text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-blue-100 overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2">
                                                <div dangerouslySetInnerHTML={{ __html: group.passageTable }} />
                                            </div>
                                        )}

                                        {group.passageTranslation && (
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <div className="text-xs font-medium text-slate-500 mb-2">📖 Tạm dịch:</div>
                                                <div className="text-sm text-slate-600 italic leading-relaxed">
                                                    {group.passageTranslation}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Questions in this section */}
                                <div className="space-y-3">
                                    {group.questions.filter(q => q.type !== "SECTION_HEADER").map((q) => {
                                        const currentIndex = questionCounter++;
                                        const parsed = q.parsed;

                                        // Fallback: If no items are present, try to extract them from the text
                                        let displayText = parsed.text;
                                        let displayItems = parsed.items || [];

                                        if (displayItems.length === 0) {
                                            // Attempt to extract "a. ... b. ..." pattern
                                            const regex = /(?:^|\s)([a-e])\.\s+(.*?)(?=\s+[a-e]\.\s+|$)/g;
                                            const matches = Array.from(parsed.text.matchAll(regex));

                                            if (matches.length >= 2) {
                                                displayItems = matches.map(m => `${m[1]}. ${m[2]}`);
                                                // The intro is everything before the first item
                                                const firstMatchIndex = parsed.text.indexOf(matches[0][0]);
                                                displayText = parsed.text.substring(0, firstMatchIndex).trim();
                                            }
                                        }

                                        return (
                                            <div key={q.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-slate-700">Câu {currentIndex + 1} ({q.type})</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditQuestion(q)}
                                                            className="text-slate-400 hover:text-indigo-600 transition"
                                                            title="Sửa câu hỏi"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuestion(q.id)}
                                                            className="text-slate-400 hover:text-red-500 transition"
                                                            title="Xóa câu hỏi"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-slate-900 font-medium mb-3 [&_strong]:font-bold [&_em]:italic [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2">
                                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                                        {displayText}
                                                    </ReactMarkdown>
                                                </div>

                                                {/* Display Items for ORDERING questions */}
                                                {displayItems.length > 0 && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 mb-3">
                                                        <div className="text-sm font-medium text-amber-700 mb-2">
                                                            📝 Các câu cần sắp xếp:
                                                        </div>
                                                        {displayItems.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="text-sm text-slate-700 pl-3 py-2 border-l-4 border-amber-400 bg-white rounded-r-lg px-3 shadow-sm"
                                                            >
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Answer Options (for MCQ and ORDERING) */}
                                                {parsed.options && parsed.options.length > 0 && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {parsed.options.map((opt: string, i: number) => {
                                                            const isCorrect = opt === q.correctAnswer || q.correctAnswer === String.fromCharCode(65 + i);
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`p-2 rounded-lg border text-sm ${isCorrect
                                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                                                                        : "border-slate-100 bg-slate-50 text-slate-600"
                                                                        }`}
                                                                >
                                                                    {opt}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                <div className="mt-3 text-xs text-slate-400">
                                                    Điểm: {q.points} | Đáp án đúng: {q.correctAnswer}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Question Button */}
                {/* Add Part Button (Bottom of list) */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={() => {
                            setNewSectionTitle(`Part ${groupedQuestions.length + 1}`);
                            setIsAddingSection(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 font-bold rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition w-full max-w-md justify-center"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Thêm Phần Thi Mới (Add Part)
                    </button>
                </div>
            </div>

            {/* Add Question Button / Form */}
            <div className="mt-6 flex justify-center">
                {assignment?.type === "ESSAY" ? (
                    questions.length === 0 && (
                        <div className="w-full max-w-2xl">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Đề bài viết (Essay Prompt)</label>
                            <Textarea
                                value={essayPrompt || ""}
                                onChange={(e) => setEssayPrompt(e.target.value)}
                                placeholder="Nhập chủ đề bài viết..."
                                className="min-h-[150px] mb-4"
                            />
                            <button
                                onClick={onSaveQuestion}
                                disabled={!essayPrompt.trim()}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Lưu đề bài
                            </button>
                        </div>
                    )
                ) : (
                    <>
                    </>
                )}
            </div>

            {/* Modals */}
            {isAddingQuestion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">{editingQuestionId ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Loại câu hỏi</label>
                                <select
                                    value={newQuestion.type}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg bg-white"
                                >
                                    <option value="MCQ">Trắc nghiệm (MCQ)</option>
                                    <option value="GAP_FILL">Điền vào chỗ trống (Gap Fill)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung câu hỏi</label>
                                <Textarea
                                    value={newQuestion.text || ""}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                    className="min-h-[100px]"
                                />
                                {newQuestion.type === "GAP_FILL" && (
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-500 mb-2">
                                            * Nhập nội dung chứa chỗ trống (dùng ...). Nhập đáp án đúng vào ô bên dưới.
                                        </p>
                                        <label className="block text-sm font-medium mb-1">Đáp án đúng</label>
                                        <input
                                            type="text"
                                            value={newQuestion.correctAnswerText}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswerText: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Ví dụ: apples"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Only show Options inputs for MCQ */}
                            {newQuestion.type === "MCQ" && (
                                <div className="grid grid-cols-2 gap-4">
                                    {newQuestion.options.map((opt, idx) => (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-medium">Đáp án {String.fromCharCode(65 + idx)}</label>
                                                <input
                                                    type="checkbox"
                                                    checked={newQuestion.correctAnswerIndexes.includes(idx)}
                                                    onChange={() => {
                                                        const current = newQuestion.correctAnswerIndexes;
                                                        const newIndexes = current.includes(idx)
                                                            ? current.filter(i => i !== idx)
                                                            : [...current, idx];
                                                        setNewQuestion({ ...newQuestion, correctAnswerIndexes: newIndexes });
                                                    }}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...newQuestion.options];
                                                    newOpts[idx] = e.target.value;
                                                    setNewQuestion({ ...newQuestion, options: newOpts });
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setIsAddingQuestion(false)} className="px-4 py-2 text-slate-500">Hủy</button>
                                <button onClick={onSaveQuestion} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingSection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-lg font-bold mb-4">Chỉnh sửa nội dung: {editingSection.sectionTitle}</h3>
                        <div className="space-y-4">
                            {/* Section Title */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Tiêu đề phần (Section Title)</label>
                                <input
                                    type="text"
                                    value={editingSection.sectionTitle}
                                    onChange={(e) => setEditingSection({ ...editingSection, sectionTitle: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            {/* Section Audio */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Audio cho phần này - <span className="italic font-normal text-slate-500">Dành cho Listening</span></label>
                                <AudioManager
                                    assignmentId={assignmentId}
                                    settings={{ audioUrl: editingSection.sectionAudio }}
                                    onUpdateSettings={(newSettings) => setEditingSection({ ...editingSection, sectionAudio: newSettings.audioUrl })}
                                    label="Cài đặt Audio"
                                />
                            </div>

                            {/* Passage Editor - Hybrid Mode */}
                            {/* Conditional Editor Logic: Table Mode vs Rich Text Mode */}
                            {(() => {
                                // Combine content if needed (for legacy split data)
                                const combinedContent = (editingSection.passage || "") + (editingSection.passageTable ? "\n" + editingSection.passageTable : "");
                                const hasTable = combinedContent.includes("<table") || (editingSection.passageTable && editingSection.passageTable.includes("<table"));

                                return (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium">Nội dung đoạn văn</label>
                                            <span className={`text-xs px-2 py-1 rounded-full ${hasTable ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                                                {hasTable ? "📄 Chế độ Mã nguồn (Do có Bảng)" : "📝 Chế độ Soạn thảo (Văn bản)"}
                                            </span>
                                        </div>

                                        {hasTable ? (
                                            /* HTML Source Mode (For Tables) */
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <span className="text-xs font-semibold text-slate-500">Mã nguồn HTML (Chứa bảng):</span>
                                                    <Textarea
                                                        value={editingSection.passageTable || editingSection.passage} // Prefer table field if mostly table, or passage if mixed. Actually let's use a local state? 
                                                        // Better: We are editing 'passage' as the main storage now.
                                                        // But wait, existing state has split fields.
                                                        // Let's edit 'passageTable' if it exists, or 'passage' if it has table?
                                                        // User wants MERGED view. 
                                                        // Let's edit 'passage' and clear 'passageTable' on save.
                                                        // For now, display combined, edit 'passage'.
                                                        defaultValue={combinedContent}
                                                        onChange={(e) => setEditingSection({ ...editingSection, passage: e.target.value, passageTable: "" })}
                                                        className="h-64 font-mono text-xs"
                                                        placeholder='<table border="1">...</table>'
                                                    />
                                                    <p className="text-[10px] text-slate-400">* Hệ thống phát hiện có Bảng, chuyển sang chế độ mã nguồn để tránh lỗi cấu trúc.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-xs font-semibold text-indigo-600">Xem trước:</span>
                                                    <div className="h-64 overflow-y-auto w-full p-3 border rounded-lg bg-slate-50 text-sm [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 prose prose-sm max-w-none">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                                            {combinedContent}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Rich Text Mode (Normal Text) */
                                            <div className="space-y-1">
                                                {/* Markdown Fix: Convert Markdown to HTML for Editor */}
                                                <Editor
                                                    value={editingSection.passage
                                                        .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>') // Bold
                                                        .replace(/__([\s\S]*?)__/g, '<u>$1</u>')             // Underline
                                                        .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')           // Italic
                                                    }
                                                    onChange={(val) => setEditingSection({ ...editingSection, passage: val })}
                                                />
                                                <p className="text-[10px] text-slate-400">* Soạn thảo văn bản bình thường (Đậm, nghiêng...).</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Translation Editor */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Dịch nghĩa (Optional)</label>
                                <Textarea
                                    value={editingSection.passageTranslation}
                                    onChange={(e) => setEditingSection({ ...editingSection, passageTranslation: e.target.value })}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setEditingSection(null)} className="px-4 py-2 text-slate-500">Hủy</button>
                                <button onClick={onSaveSection} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu thay đổi</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAddingSection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Thêm Phần Thi Mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên phần (VD: Part 1, Reading Passage 1...)</label>
                                <input
                                    type="text"
                                    value={newSectionTitle}
                                    onChange={(e) => setNewSectionTitle(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Part X..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Loại phần thi</label>
                                <select
                                    value={newSectionType}
                                    onChange={(e) => setNewSectionType(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="MCQ">Trắc nghiệm (MCQ)</option>
                                    <option value="LISTENING">Listening</option>
                                    <option value="READING">Reading</option>
                                    <option value="WRITING">Writing</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setIsAddingSection(false)} className="px-4 py-2 text-slate-500">Hủy</button>
                                <button onClick={handleCreateSection} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Tạo mới</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
