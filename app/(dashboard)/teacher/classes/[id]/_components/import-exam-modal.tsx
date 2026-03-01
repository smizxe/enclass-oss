"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, X, Loader2, Check, AlertCircle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { CompactGapFillSection } from "@/components/questions/compact-gap-fill-section";

interface Question {
    questionNumber?: number;
    type: string;
    content: string;
    items?: string[]; // For ORDERING questions
    options?: string[];
    correctAnswer?: string;
    explanation?: string | null;
}

interface Section {
    title: string;
    type: string;
    passage?: string | null;
    notePassage?: string | null;
    passageTable?: string | null;
    passageTranslation?: string | null;
    questions: Question[];
}

interface ImportExamModalProps {
    classId: string;
    importType?: "MCQ" | "LISTENING";
    onClose: () => void;
    onSuccess: () => void;
}

// Staged progress configuration — extended for client-side AI processing
const PROGRESS_STAGES = [
    { progress: 5, message: "Đang tải file lên server...", duration: 1500 },
    { progress: 15, message: "Đang trích xuất nội dung file...", duration: 2000 },
    { progress: 25, message: "Đang gửi nội dung tới AI...", duration: 3000 },
    { progress: 35, message: "AI đang đọc và phân tích đề thi...", duration: 10000 },
    { progress: 45, message: "AI đang trích xuất câu hỏi...", duration: 15000 },
    { progress: 55, message: "AI đang xử lý đáp án...", duration: 20000 },
    { progress: 65, message: "AI đang viết lời giải...", duration: 25000 },
    { progress: 75, message: "AI đang kiểm tra lại kết quả...", duration: 30000 },
    { progress: 85, message: "AI đang hoàn tất JSON...", duration: 40000 },
    { progress: 92, message: "Đang xử lý kết quả...", duration: 60000 },
];

/**
 * Client-side JSON repair: fix common AI output issues
 */
function repairAndParseJSON(rawText: string) {
    let jsonString = rawText.trim();

    // Strip markdown code fences
    if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    // Extract JSON object
    const firstBrace = jsonString.indexOf("{");
    const lastBrace = jsonString.lastIndexOf("}");
    if (firstBrace > 0 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    // Fix unescaped control characters inside JSON strings
    jsonString = jsonString.replace(
        /("(?:[^"\\]|\\.)*")/g,
        (match) => {
            return match
                .replace(/(?<!\\)\t/g, '\\t')
                .replace(/(?<!\\)\r\n/g, '\\n')
                .replace(/(?<!\\)\r/g, '\\n')
                .replace(/(?<!\\)\n/g, '\\n');
        }
    );

    // Remove trailing commas before } or ]
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');

    // Auto-close truncated JSON
    const openBraces = (jsonString.match(/{/g) || []).length;
    const closeBraces = (jsonString.match(/}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) jsonString += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) jsonString += '}';

    const data = JSON.parse(jsonString);

    // Post-process: Clean up options
    if (data.sections) {
        for (const section of data.sections) {
            for (const q of section.questions || []) {
                if (q.options && Array.isArray(q.options)) {
                    q.options = q.options.map((opt: string) => {
                        return opt.replace(/^([A-D])\.\s*\1\.\s*/i, '$1. ')
                            .replace(/^([A-D])\.\s*/i, '').trim();
                    });

                    const allSingleLetters = q.options.every((opt: string) =>
                        /^[A-Da-d]$/.test(opt.trim())
                    );

                    if (allSingleLetters && q.content) {
                        const inlinePattern = /\b([A-D])\.\s+([^A-D]*?)(?=\s+[A-D]\.\s|$)/g;
                        const matches: RegExpExecArray[] = Array.from(q.content.matchAll(inlinePattern));

                        if (matches.length >= 2) {
                            const extractedOptions = matches.map((m: RegExpExecArray) => m[2].trim());
                            const firstMatchIndex = q.content.indexOf(matches[0][0]);
                            if (firstMatchIndex > 0) {
                                q.content = q.content.substring(0, firstMatchIndex).trim();
                            }
                            q.options = extractedOptions;
                        }
                    }

                    if (!allSingleLetters && q.content) {
                        const trailingPattern = /\s+[A-D]\.\s+\S+(?:\s+[A-D]\.\s+\S+){1,3}\s*$/;
                        if (trailingPattern.test(q.content)) {
                            q.content = q.content.replace(/\s+[A-D]\.\s+[^A-D]*(?:\s+[A-D]\.\s+[^A-D]*)*\s*$/, '').trim();
                        }
                    }
                }
            }
        }
    }

    return data;
}

export const ImportExamModal = ({ classId, importType = "MCQ", onClose, onSuccess }: ImportExamModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [step, setStep] = useState<"upload" | "preview" | "saving">("upload");
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
    const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

    const [progressMessage, setProgressMessage] = useState("");
    const [progressPercent, setProgressPercent] = useState(0);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const stageIndexRef = useRef(0);

    // Fake staged progress effect
    useEffect(() => {
        if (isLoading && step === "upload") {
            const runNextStage = () => {
                if (stageIndexRef.current < PROGRESS_STAGES.length) {
                    const stage = PROGRESS_STAGES[stageIndexRef.current];
                    setProgressPercent(stage.progress);
                    setProgressMessage(stage.message);
                    stageIndexRef.current++;
                    progressTimerRef.current = setTimeout(runNextStage, stage.duration);
                }
            };
            runNextStage();
        }

        return () => {
            if (progressTimerRef.current) {
                clearTimeout(progressTimerRef.current);
            }
        };
    }, [isLoading, step]);

    // Reset progress when loading stops
    useEffect(() => {
        if (!isLoading) {
            stageIndexRef.current = 0;
            if (progressTimerRef.current) {
                clearTimeout(progressTimerRef.current);
            }
        }
    }, [isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const fileName = selectedFile.name.toLowerCase();
            if (!fileName.endsWith(".docx") && !fileName.endsWith(".pdf")) {
                setError("Chỉ hỗ trợ file .docx hoặc .pdf");
                return;
            }
            setFile(selectedFile);
            setError("");
            setTitle(selectedFile.name.replace(/\.(docx|pdf)$/i, ""));
        }
    };

    /**
     * New 2-phase upload:
     * Phase 1: Server extracts text from file (fast, ~2s)
     * Phase 2: Browser calls Gemini AI directly (no Vercel timeout!)
     */
    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        setError("");
        setProgressPercent(0);
        setProgressMessage("Đang tải file lên server...");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("importType", importType);

        try {
            // === PHASE 1: Server extracts text (fast) ===
            const extractResponse = await fetch(`/api/teacher/classes/${classId}/import`, {
                method: "POST",
                body: formData,
            });

            if (!extractResponse.ok) {
                const errorText = await extractResponse.text();
                throw new Error(errorText || "Lỗi khi trích xuất file");
            }

            const extractData = await extractResponse.json();
            const { prompt, fileType, extractedText, base64Data, apiKey } = extractData;

            if (!apiKey) {
                throw new Error("Không nhận được API Key từ server. Vui lòng liên hệ quản trị viên.");
            }

            // === PHASE 2: Browser calls Gemini directly (NO timeout!) ===
            setProgressPercent(25);
            setProgressMessage("Đang gửi nội dung tới AI...");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-3.1-pro-preview",
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.2,
                },
            });

            // Build prompt parts based on file type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let promptParts: any[] = [];

            if (fileType === "pdf") {
                promptParts = [
                    { text: prompt },
                    { inlineData: { mimeType: "application/pdf", data: base64Data } },
                ];
            } else {
                // DOCX or TXT — text already extracted by server
                promptParts = [
                    { text: prompt + `\n\n**INPUT CONTENT:**\n"""\n${extractedText}\n"""` },
                ];
            }

            setProgressPercent(35);
            setProgressMessage("AI đang đọc và phân tích đề thi...");

            // Call Gemini from the browser — unlimited time!
            const result = await model.generateContent(promptParts);
            const response = result.response;
            const fullText = response.text();

            // === PHASE 3: Parse and repair JSON ===
            setProgressPercent(90);
            setProgressMessage("Đang xử lý kết quả...");

            const data = repairAndParseJSON(fullText);

            if (data.sections && Array.isArray(data.sections)) {
                setSections(data.sections);
            } else if (Array.isArray(data)) {
                setSections([{
                    title: "Câu hỏi",
                    type: "STANDALONE",
                    passage: null,
                    passageTranslation: null,
                    questions: data.map((q: Question, i: number) => ({
                        ...q,
                        questionNumber: i + 1,
                    })),
                }]);
            } else {
                setSections([]);
            }
            setStep("preview");

        } catch (err: unknown) {
            console.error(err);
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi phân tích file. Vui lòng thử lại.";
            setError(errorMsg);
        } finally {
            setProgressPercent(100);
            setProgressMessage("Hoàn tất!");
            setTimeout(() => {
                setIsLoading(false);
                setProgressMessage("");
                setProgressPercent(0);
            }, 500);
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
                        {step === "upload" && (importType === "LISTENING" ? "Import đề thi Listening (AI)" : "Import câu hỏi MCQ (AI)")}
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
                                <input type="file" accept=".docx,.pdf" onChange={handleFileChange} className="hidden" id="file-upload" />
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

                            {/* Progress Bar - shown when loading */}
                            {isLoading && (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                                            <span className="text-sm font-medium text-slate-700">{progressMessage}</span>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">
                                        ⏳ AI đang xử lý... Vui lòng đợi trong giây lát
                                    </p>
                                </div>
                            )}

                            {!isLoading && (
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <h3 className="font-medium text-slate-700 mb-2">Hướng dẫn</h3>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>• Hỗ trợ định dạng đề thi TNPT (THPT Quốc gia)</li>
                                        <li>• AI sẽ tự động nhận diện các phần (Reading, Gap Fill...)</li>
                                        <li>• Bài đọc chung sẽ được nhóm với các câu hỏi liên quan</li>
                                    </ul>
                                </div>
                            )}
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
                                                {/* Check if questions are GAP_FILL with {N} markers in passage */}
                                                {(() => {
                                                    type QuestionRun = {
                                                        mode: "gap_fill" | "standard";
                                                        questions: Question[];
                                                        startIdx: number;
                                                    };

                                                    const runs: QuestionRun[] = [];
                                                    let currentRun: QuestionRun | null = null;

                                                    section.questions.forEach((q, idx) => {
                                                        const mode = (q.type || "").toUpperCase().includes("GAP") && (section.notePassage || section.passage) ? "gap_fill" : "standard";
                                                        if (!currentRun || currentRun.mode !== mode) {
                                                            currentRun = { mode, questions: [], startIdx: idx };
                                                            runs.push(currentRun);
                                                        }
                                                        currentRun.questions.push(q);
                                                    });

                                                    return (
                                                        <>
                                                            {/* Global Passage */}
                                                            {section.passage && (
                                                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                                                    <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                                                                        <BookOpen className="w-4 h-4" />
                                                                        Đoạn văn chung
                                                                    </div>
                                                                    <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1">
                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                                                            {(section.passage || '').replace(/\\n/g, '\n').replace(/\n/g, '  \n')}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                    {section.passageTable && !section.notePassage && (
                                                                        <div className="mt-3 overflow-x-auto bg-white p-2 rounded border border-slate-200" dangerouslySetInnerHTML={{ __html: section.passageTable }} />
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Render each run */}
                                                            {runs.map((run, runIdx) => {
                                                                if (run.mode === "gap_fill" && (section.notePassage || section.passage)) {
                                                                    const compactQuestions = run.questions.map((q, idx) => ({
                                                                        id: `preview-${sIndex}-${run.startIdx + idx}`,
                                                                        parsed: { text: q.content },
                                                                        correctAnswer: q.correctAnswer || "",
                                                                        points: 1,
                                                                        questionNumber: q.questionNumber || (run.startIdx + idx + 1)
                                                                    }));

                                                                    return (
                                                                        <div key={`run-${runIdx}`} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
                                                                            <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium mb-2">
                                                                                <BookOpen className="w-4 h-4" />
                                                                                Bài đọc dạng điền từ (Compact View)
                                                                            </div>
                                                                            <CompactGapFillSection
                                                                                passage={section.notePassage || section.passage || ""}
                                                                                questions={compactQuestions}
                                                                                answers={{}}
                                                                                onAnswerChange={() => { }}
                                                                                startIndex={0}
                                                                                mode="teacher_preview"
                                                                            />
                                                                            {section.passageTable && section.notePassage && (
                                                                                <div className="mt-3 overflow-x-auto bg-white p-2 rounded border border-slate-200" dangerouslySetInnerHTML={{ __html: section.passageTable }} />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }

                                                                // Standard questions
                                                                return (
                                                                    <div key={`run-${runIdx}`} className="space-y-3 mb-4">
                                                                        {run.questions.map((q, qIndex) => {
                                                                            const absoluteIndex = run.startIdx + qIndex;
                                                                            const expKey = `${sIndex}-${absoluteIndex}`;
                                                                            return (
                                                                                <div key={absoluteIndex} className="p-3 bg-white border border-slate-200 rounded-lg">
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
                                                                                        <div className="mt-2 text-sm text-slate-800 [&_strong]:font-bold [&_em]:italic [&_p]:mb-2">
                                                                                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                                                                                {q.content.replace(/\\n/g, '\n').replace(/\n/g, '  \n')}
                                                                                            </ReactMarkdown>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Display Items for ORDERING questions */}
                                                                                    {q.items && q.items.length > 0 && (
                                                                                        <div className="mt-2 text-sm space-y-1">
                                                                                            {q.items.map((item, idx) => (
                                                                                                <div key={idx} className="bg-amber-50 border border-amber-200 text-slate-700 px-3 py-1.5 rounded">
                                                                                                    {item}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
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
                                                                );
                                                            })}
                                                        </>
                                                    );
                                                })()}
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
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý... ({progressPercent}%)</>
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
