"use client";

import { useState } from "react";
import { AudioRecorder } from "@/components/audio-recorder";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface SpeakingQuestionProps {
    question: any;
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}

export function SpeakingQuestion({ question, value, onChange, disabled }: SpeakingQuestionProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleAudioCaptured = async (audioBlob: Blob) => {
        if (!audioBlob || audioBlob.size === 0) return;

        setIsUploading(true);
        const toastId = toast.loading("Đang tải lên audio...");

        try {
            const fileName = `submissions/${question.assignmentId}/${question.id}/${Date.now()}.webm`;

            const { data, error } = await supabase.storage
                .from('submissions')
                .upload(fileName, audioBlob, {
                    contentType: 'audio/webm'
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('submissions')
                .getPublicUrl(fileName);

            onChange(publicUrlData.publicUrl);
            toast.success("Đã lưu đoạn ghi âm", { id: toastId });
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Lỗi khi tải lên audio", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-medium text-slate-700 mb-2">
                    {/* Use parsed text if available, or try to parse content if it's a string */}
                    {question.parsed ? question.parsed.text : (() => {
                        try { return JSON.parse(question.content).text } catch { return question.content }
                    })()}
                </p>
                {/* AI Rubric hidden from student as requested */}

                <div className="mt-4">
                    <AudioRecorder
                        onAudioCaptured={handleAudioCaptured}
                        existingAudioUrl={value}
                        disabled={disabled || isUploading}
                    />
                    {isUploading && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-indigo-600 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Đang xử lý file ghi âm...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
