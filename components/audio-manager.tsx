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
}

export const AudioManager = ({ assignmentId, settings, onUpdateSettings }: AudioManagerProps) => {
    const [uploading, setUploading] = useState(false);
    const [globalAudio, setGlobalAudio] = useState<string | null>(settings?.audioUrl || null);

    const handleUpload = async (file: File) => {
        if (!supabase) {
            toast.error("Hệ thống chưa cấu hình lưu trữ (Supabase)");
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${assignmentId}-${Date.now()}.${fileExt}`;
            const filePath = `audio/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('assignments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('assignments').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            // Update local state and parent
            setGlobalAudio(publicUrl);
            onUpdateSettings({ ...settings, audioUrl: publicUrl });
            toast.success("Upload audio thành công!");

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Lỗi khi upload audio");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500" />
                Cài đặt Audio (Listening)
            </h3>

            {/* Global Audio for now - MVP */}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Audio chung cho cả bài (Global)
                    </label>

                    {globalAudio ? (
                        <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <PlayCircle className="w-5 h-5 text-indigo-600" />
                            <audio controls src={globalAudio} className="h-8 w-64" />
                            <button
                                onClick={() => {
                                    setGlobalAudio(null);
                                    onUpdateSettings({ ...settings, audioUrl: null });
                                }}
                                className="ml-auto text-slate-400 hover:text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
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

                {/* Note about sections */}
                <p className="text-xs text-slate-400 italic">
                    * Tính năng chia Audio theo từng Part sẽ được cập nhật sau. Hiện tại dùng 1 file chung.
                </p>
            </div>
        </div>
    );
};
