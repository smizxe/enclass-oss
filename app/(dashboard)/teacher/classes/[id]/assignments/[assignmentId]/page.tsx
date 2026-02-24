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
    BookOpen,
    Pencil,
    Upload,
    ArrowUp,
    ArrowDown,
    X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AudioManager } from "@/components/audio-manager";
import { Editor } from "@/components/editor";
import { supabase } from "@/lib/supabase";
import showdown from "showdown";

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
    sectionVideo?: string;
    sectionImages?: string[];
}

interface QuestionGroup {
    sectionTitle: string;
    sectionType: string;
    sectionAudio?: string;
    sectionVideo?: string;
    sectionImages?: string[];
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
    isTestMode: boolean;
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
        sectionTitle: string;
        aiRubric?: string; // Added for AI Grading
    }>({
        type: "MCQ",
        text: "",
        options: ["", "", "", ""],
        correctAnswerIndexes: [],
        correctAnswerText: "",
        points: 1,
        sectionTitle: "",
        aiRubric: ""
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
        sectionVideo?: string;
        sectionImages?: string[];
        passage: string;
        passageTable: string;
        passageTranslation: string;
    } | null>(null);

    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Max Attempts Setting State
    const [localMaxAttempts, setLocalMaxAttempts] = useState<number>(1);
    const [maxAttemptsChanged, setMaxAttemptsChanged] = useState(false);

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
                // Sync local maxAttempts state
                setLocalMaxAttempts(res.data.settings?.maxAttempts || 1);
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
                    sectionVideo: parsed.sectionVideo,
                    sectionImages: parsed.sectionImages || [],
                    passage: parsed.passage,
                    passageTranslation: parsed.passageTranslation,
                    questions: []
                };
            }

            // Sync Passage Info if the current question has passage info and the group doesn't (or update it)
            // Usually the first question carries the passage info, or all of them do.
            if (parsed.passage && !currentGroup.passage) currentGroup.passage = parsed.passage;
            if (parsed.passageTranslation && !currentGroup.passageTranslation) currentGroup.passageTranslation = parsed.passageTranslation;
            // Sync Audio & Video
            if (parsed.sectionAudio && !currentGroup.sectionAudio) currentGroup.sectionAudio = parsed.sectionAudio;
            if (parsed.sectionVideo && !currentGroup.sectionVideo) currentGroup.sectionVideo = parsed.sectionVideo;
            // Sync Images (Merge if unique)
            if (parsed.sectionImages && parsed.sectionImages.length > 0) {
                if (!currentGroup.sectionImages) currentGroup.sectionImages = [];
                parsed.sectionImages.forEach(img => {
                    if (!currentGroup!.sectionImages?.includes(img)) {
                        currentGroup!.sectionImages!.push(img);
                    }
                });
            }

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

    // Delete Section functionality
    const handleDeleteSection = async (sectionTitle: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ câu hỏi trong phần "${sectionTitle}"? Hành động này không thể hoàn tác.`)) return;
        try {
            await axios.delete(`/api/teacher/assignments/${assignmentId}/questions?sectionTitle=${encodeURIComponent(sectionTitle)}`);
            toast.success(`Đã xóa phần "${sectionTitle}"`);
            fetchQuestions();
        } catch {
            toast.error("Lỗi xóa phần thi");
        }
    };

    // Move Section functionality
    const handleMoveSection = async (sectionTitle: string, direction: "UP" | "DOWN") => {
        try {
            await axios.post(`/api/teacher/assignments/${assignmentId}/reorder-section`, {
                sectionTitle,
                direction
            });
            toast.success(`Đã di chuyển phần "${sectionTitle}"`);
            fetchQuestions();
        } catch {
            toast.error("Lỗi di chuyển phần thi");
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

        const existingSectionTitle = parsed.sectionTitle || "General";

        setNewQuestion({
            type: q.type,
            text: parsed.text,
            options: options,
            correctAnswerIndexes: indexes,
            correctAnswerText: answerText,
            points: q.points,
            sectionTitle: existingSectionTitle,
            aiRubric: (parsed as any).aiRubric || ""
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
            sectionTitle: newQuestion.sectionTitle || "General",
            aiRubric: newQuestion.aiRubric // Save AI Rubric
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
                points: 1,
                sectionTitle: "",
                aiRubric: ""
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
            sectionVideo: group.sectionVideo,
            sectionImages: group.sectionImages || [],
            passage: (() => {
                const converter = new showdown.Converter();
                return converter.makeHtml(group.passage || "");
            })(),
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
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Cấu hình bài tập
                    </h2>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded font-mono">ID: {assignmentId}</span>
                </div>

                {/* Audio Manager */}
                <AudioManager
                    assignmentId={assignmentId}
                    settings={assignment?.settings || null}
                    onUpdateSettings={onUpdateSettings}
                    label="Audio Chung (Global)"
                    description="Áp dụng cho toàn bộ bài thi nếu không có audio riêng từng phần"
                />

                {/* Settings Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Max Attempts Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg h-fit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Số lần làm bài</h3>
                                    <p className="text-sm text-slate-500 mt-1 max-w-[280px]">
                                        Giới hạn số lần học viên có thể nộp bài.
                                    </p>
                                    <p className="text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">
                                        {localMaxAttempts === 1
                                            ? "Chỉ được làm 1 lần duy nhất"
                                            : `Được phép làm lại ${localMaxAttempts} lần`
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            const newVal = Math.max(1, localMaxAttempts - 1);
                                            setLocalMaxAttempts(newVal);
                                            setMaxAttemptsChanged(newVal !== (assignment?.settings?.maxAttempts || 1));
                                        }}
                                        className="px-3 py-2 hover:bg-slate-100 text-slate-500 transition border-r border-slate-200"
                                    >-</button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={localMaxAttempts}
                                        onChange={(e) => {
                                            const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                                            setLocalMaxAttempts(val);
                                            setMaxAttemptsChanged(val !== (assignment?.settings?.maxAttempts || 1));
                                        }}
                                        className="w-12 py-2 text-center text-slate-900 font-semibold bg-transparent focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const newVal = Math.min(10, localMaxAttempts + 1);
                                            setLocalMaxAttempts(newVal);
                                            setMaxAttemptsChanged(newVal !== (assignment?.settings?.maxAttempts || 1));
                                        }}
                                        className="px-3 py-2 hover:bg-slate-100 text-slate-500 transition border-l border-slate-200"
                                    >+</button>
                                </div>

                                {maxAttemptsChanged && (
                                    <button
                                        onClick={() => {
                                            onUpdateSettings({
                                                ...assignment?.settings,
                                                maxAttempts: localMaxAttempts
                                            });
                                            setMaxAttemptsChanged(false);
                                        }}
                                        className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition shadow-sm animate-in fade-in slide-in-from-top-1"
                                    >
                                        Lưu thay đổi
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Test Mode Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                                <div className={`p-2.5 rounded-lg h-fit transition-colors ${assignment?.isTestMode ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 13v6" /><path d="M9 16l3-3 3 3" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Chế độ kiểm tra</h3>
                                    <p className="text-sm text-slate-500 mt-1 max-w-[280px]">
                                        Xáo trộn câu hỏi mỗi khi học viên vào làm bài.
                                    </p>
                                    <div className={`text-xs font-medium mt-2 inline-block px-2 py-1 rounded transition-colors ${assignment?.isTestMode ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                                        {assignment?.isTestMode
                                            ? "Đang bật: Câu hỏi sẽ được xáo trộn"
                                            : "Đang tắt: Giữ nguyên thứ tự câu hỏi"
                                        }
                                    </div>
                                </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer mt-1">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={assignment?.isTestMode || false}
                                    onChange={async (e) => {
                                        const newVal = e.target.checked;
                                        // Optimistic update
                                        setAssignment(prev => prev ? { ...prev, isTestMode: newVal } : null);
                                        try {
                                            await axios.patch(`/api/teacher/assignments/${assignmentId}`, {
                                                isTestMode: newVal
                                            });
                                            toast.success(`Đã ${newVal ? "bật" : "tắt"} chế độ kiểm tra`);
                                        } catch {
                                            toast.error("Lỗi cập nhật chế độ kiểm tra");
                                            setAssignment(prev => prev ? { ...prev, isTestMode: !newVal } : null); // Revert
                                        }
                                    }}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

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

                                    {/* Move Buttons */}
                                    <div className="flex gap-1 ml-2">
                                        <button
                                            onClick={() => handleMoveSection(group.sectionTitle, "UP")}
                                            className="p-1 px-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                            disabled={groupIndex === 0}
                                            title="Chuyển lên trên"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleMoveSection(group.sectionTitle, "DOWN")}
                                            className="p-1 px-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                            disabled={groupIndex === groupedQuestions.length - 1}
                                            title="Chuyển xuống dưới"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>

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
                                    <button
                                        onClick={() => handleDeleteSection(group.sectionTitle)}
                                        className="ml-2 text-slate-400 hover:text-red-500 transition"
                                        title="Xóa toàn bộ phần này"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    rehypePlugins={[rehypeRaw]}
                                                    components={{
                                                        // Ensure tables don't get stripped or messed up
                                                        table: ({ node: _node, ...props }) => <table className="w-full border-collapse border border-slate-300" {...props} />,
                                                        th: ({ node: _node, ...props }) => <th className="border border-slate-300 bg-slate-50 p-2 text-left" {...props} />,
                                                        td: ({ node: _node, ...props }) => <td className="border border-slate-300 p-2" {...props} />,
                                                    }}
                                                >
                                                    {group.passage.replace(/\n/g, "  \n")}
                                                </ReactMarkdown>
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

                                                {/* Answer Options (for MCQ and ORDERING only - not for SPEAKING/WRITING) */}
                                                {parsed.options && parsed.options.length > 0 && !["SPEAKING", "WRITING", "ESSAY"].includes(q.type) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {parsed.options.map((opt: string, i: number) => {
                                                            const optionLetter = String.fromCharCode(65 + i);
                                                            const val = (q.correctAnswer || "").trim();
                                                            // Split by comma or semicolon to support multi-select answers
                                                            const correctAnswers = val.split(/[,;]\s*/).map(s => s.trim()).filter(s => s.length > 0);

                                                            const isCorrect = correctAnswers.some(ans => {
                                                                return opt === ans ||
                                                                    ans === optionLetter ||
                                                                    (opt.startsWith(`${optionLetter}.`) && ans === optionLetter) ||
                                                                    (ans.length > 0 && opt.includes(ans) && ans.length > 2);
                                                            });

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`p-2 rounded-lg border text-sm ${isCorrect
                                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold"
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
                {assignment?.type === "ESSAY" && questions.length === 0 && (
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
                )}
                {/* Sticky Action Bar for Non-Essay Assignments */}
                {assignment?.type !== "ESSAY" && (
                    <>
                        {/* Spacer to prevent content from being hidden behind sticky bar */}
                        <div className="h-24"></div>

                        <div className="fixed bottom-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-40 flex justify-center gap-4 transition-all duration-300 md:left-72 left-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                            <button
                                onClick={() => {
                                    setNewQuestion({
                                        type: "MCQ",
                                        text: "",
                                        options: ["", "", "", ""],
                                        correctAnswerIndexes: [],
                                        correctAnswerText: "",
                                        points: 1,
                                        sectionTitle: groupedQuestions.length > 0 ? groupedQuestions[groupedQuestions.length - 1].sectionTitle : "Part 1"
                                    });
                                    setIsAddingQuestion(true);
                                }}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Thêm Câu Hỏi Mới
                            </button>
                        </div>
                    </>
                )}

                {/* Modals */}
                {isAddingQuestion && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">{editingQuestionId ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</h3>
                            <div className="space-y-4">
                                { /* Section Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thêm vào Phần (Section)</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={groupedQuestions.map(g => g.sectionTitle).includes(newQuestion.sectionTitle) ? newQuestion.sectionTitle : "__NEW__"}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "__NEW__") {
                                                    setNewQuestion({ ...newQuestion, sectionTitle: "" });
                                                } else {
                                                    setNewQuestion({ ...newQuestion, sectionTitle: val });
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 border rounded-lg bg-white"
                                        >
                                            <option value="" disabled>-- Chọn Phần --</option>
                                            {groupedQuestions.map((g, idx) => (
                                                <option key={idx} value={g.sectionTitle}>{g.sectionTitle}</option>
                                            ))}
                                            <option value="__NEW__">+ Tạo phần mới...</option>
                                        </select>
                                        {!groupedQuestions.map(g => g.sectionTitle).includes(newQuestion.sectionTitle) && (
                                            <input
                                                type="text"
                                                placeholder="Nhập tên phần mới..."
                                                value={newQuestion.sectionTitle}
                                                onChange={(e) => setNewQuestion({ ...newQuestion, sectionTitle: e.target.value })}
                                                className="flex-1 px-3 py-2 border rounded-lg bg-white border-indigo-300"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Loại câu hỏi</label>
                                    <select
                                        value={newQuestion.type}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                    >
                                        <option value="MCQ">Trắc nghiệm (MCQ)</option>
                                        <option value="GAP_FILL">Điền vào chỗ trống (Gap Fill)</option>
                                        <option value="SPEAKING">Luyện nói (AI Speaking)</option>
                                        <option value="WRITING">Luyện viết (AI Writing/Essay)</option>
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

                                {/* AI Grading Settings (for SPEAKING & WRITING) */}
                                {(newQuestion.type === "SPEAKING" || newQuestion.type === "WRITING") && (
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <p className="text-sm font-bold text-indigo-800 mb-2">🤖 Cấu hình AI Chấm điểm</p>
                                        <label className="block text-sm font-medium mb-1">Hướng dẫn chấm (Rubric)</label>
                                        <p className="text-xs text-slate-500 mb-2">
                                            Nhập tiêu chí chấm điểm cho AI. Ví dụ: "Chấm theo thang 10. Chú trọng phát âm và trôi chảy..."
                                        </p>
                                        <Textarea
                                            value={newQuestion.aiRubric || ""}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, aiRubric: e.target.value })}
                                            placeholder="Nhập tiêu chí chấm điểm..."
                                            className="min-h-[100px] bg-white"
                                        />
                                    </div>
                                )}

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

                                {/* Section Video */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Video URL (YouTube)</label>
                                    <input
                                        type="text"
                                        value={editingSection.sectionVideo || ""}
                                        onChange={(e) => setEditingSection({ ...editingSection, sectionVideo: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Dán link YouTube đầy đủ hoặc ID video.</p>
                                </div>

                                {/* Section Images */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hình ảnh đính kèm (Cho Part)</label>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-3">
                                            {editingSection.sectionImages?.map((url, idx) => (
                                                <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden group cursor-zoom-in">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={url}
                                                        alt="Section"
                                                        className="w-full h-full object-cover"
                                                        onClick={() => setLightboxImage(url)}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newImages = editingSection.sectionImages?.filter((_, i) => i !== idx);
                                                            setEditingSection({ ...editingSection, sectionImages: newImages });
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                                        title="Xóa ảnh"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 transition">
                                                <Upload className="w-6 h-6 text-slate-400" />
                                                <span className="text-[10px] text-slate-500 mt-1">Upload</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const files = e.target.files;
                                                        if (!files || files.length === 0) return;

                                                        const newUrls: string[] = [];
                                                        const toastId = toast.loading("Đang tải ảnh lên...");

                                                        for (let i = 0; i < files.length; i++) {
                                                            const file = files[i];
                                                            // Sanitize filename
                                                            const fileName = `${assignmentId}/${editingSection.sectionTitle}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                                                            const { data, error } = await supabase.storage
                                                                .from('images')
                                                                .upload(fileName, file);

                                                            if (error) {
                                                                console.error(error);
                                                                toast.error(`Lỗi tải ảnh: ${file.name}`);
                                                                continue;
                                                            }

                                                            // Get Public URL
                                                            const { data: publicUrlData } = supabase.storage
                                                                .from('images')
                                                                .getPublicUrl(fileName);

                                                            if (publicUrlData.publicUrl) {
                                                                newUrls.push(publicUrlData.publicUrl);
                                                            }
                                                        }

                                                        setEditingSection(prev => prev ? {
                                                            ...prev,
                                                            sectionImages: [...(prev.sectionImages || []), ...newUrls]
                                                        } : null);

                                                        toast.dismiss(toastId);
                                                        toast.success(`Đã tải lên ${newUrls.length} ảnh`);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
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
                                                            value={combinedContent}
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
            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxImage}
                        alt="Preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
