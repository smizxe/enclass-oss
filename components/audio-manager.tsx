"use client";

import { useState } from "react";
import { Upload, X, Volume2, Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface AudioManagerProps {
    assignmentId: string;
    settings: {
        audioUrl?: string; // Global audio
        sections?: { title: string; audioUrl?: string }[];
    } | null;
    onUpdateSettings: (newSettings: any) => void;
    label?: string; // e.g., "Audio chung (Global)"
    description?: string; // e.g., "Dành cho Listening"
}

export const AudioManager = ({ assignmentId, settings, onUpdateSettings, label = "Cài đặt Audio", description }: AudioManagerProps) => {
    // Mode determination: If settings.audioUrl is being controlled by a parent via specific props (not passed yet in this interface, but we can infer from usage context or just add props).
    // Actually, to support "Section Audio", we should extend the props.
    // Let's modify the component to accept optional `sectionAudioUrl` and `onSectionAudioChange`.

    // BUT since I can't change the call signature in `page.tsx` easily without breaking things, I will just modify this component to be generic. 
    // Wait, I CAN change the usage in `page.tsx`.

    // Let's pretend I added these props to the interface:
    const isSectionMode = Boolean(settings?.audioUrl && typeof settings.audioUrl === 'string');

    // Better approach:
    // If the parent passes `onUpdateSettings` that expects a full settings object, it's Global.
    // If the parent passes a specialized callback, it's Section.

    // Retaining original props for compatibility, but adding logic to handle "Section Mode" passed via `settings`.
    // Actually, looking at `page.tsx`, when editing a section, we render `<AudioManager settings={{ audioUrl: editingSection.sectionAudio }} onUpdateSettings={...} />`.
    // So `settings` IS the section settings context.

    const [uploading, setUploading] = useState(false);
    // If we are in "Section Mode", settings.audioUrl is the SECTION audio.
    const [currentAudio, setCurrentAudio] = useState<string | null>(settings?.audioUrl || null);

    const handleUpload = async (file: File) => {
        if (!supabase) {
            toast.error("Hệ thống chưa cấu hình lưu trữ (Supabase)");
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            // Add 'public/' prefix which is standard for many RLS policies
            const fileName = `public/${assignmentId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('audio')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('audio').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            // Update local state
            setCurrentAudio(publicUrl);

            // Notify parent
            // If this is Global, we pass { audioUrl: url, ...others }
            // If this is Section (passed as { audioUrl: ... }), we return the same structure.
            onUpdateSettings({ ...settings, audioUrl: publicUrl });

            toast.success("Upload audio thành công!");

        } catch (error) {
            console.error("Upload error:", error);
            // @ts-ignore
            if (error.title === "new row violates row-level security policy") {
                toast.error("Lỗi quyền upload (RLS). Vui lòng kiểm tra policy Supabase.");
            } else {
                toast.error("Lỗi khi upload audio");
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500" />
                {label}
                {description && <span className="text-xs font-normal text-slate-500 ml-2">- {description}</span>}
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        {currentAudio ? "File đang sử dụng" : "Upload file mới"}
                    </label>

                    {currentAudio ? (
                        <div className="relative group overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-4 transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-indigo-100">
                                    <div className="relative flex h-full w-full items-center justify-center">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-20"></span>
                                        <Volume2 className="relative z-10 h-5 w-5 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="mb-1 truncate text-xs font-semibold text-indigo-900">
                                        File Audio đang hoạt động
                                    </p>
                                    <audio
                                        controls
                                        src={currentAudio}
                                        className="h-8 w-full accent-indigo-600"
                                        style={{ height: "32px" }}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm("Bạn có chắc chắn muốn xóa file này không?")) {
                                            setCurrentAudio(null);
                                            onUpdateSettings({ ...settings, audioUrl: null });
                                        }
                                    }}
                                    className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                                    title="Xóa file audio"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition text-center cursor-pointer relative">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={uploading}
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center text-indigo-500">
                                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                    <span className="text-xs">Đang upload...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                    <Upload className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-medium">Click để upload file MP3/WAV</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
