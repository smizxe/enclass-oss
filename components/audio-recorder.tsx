"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
    onAudioCaptured: (audioBlob: Blob) => void;
    existingAudioUrl?: string | null;
    disabled?: boolean;
}

export function AudioRecorder({ onAudioCaptured, existingAudioUrl, disabled }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl && !existingAudioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    const startRecording = async () => {
        setPermissionError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                onAudioCaptured(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setPermissionError("Không thể truy cập microphone. Vui lòng cấp quyền.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const resetRecording = () => {
        setAudioUrl(null);
        setRecordingTime(0);
        onAudioCaptured(new Blob()); // Clear parent state (hacky but works if parent handles empty blob) or pass null? 
        // Better: let parent handle new capture.
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (permissionError) {
        return <div className="text-red-500 text-sm">{permissionError}</div>;
    }

    return (
        <div className="flex items-center gap-4">
            {!isRecording && !audioUrl && (
                <button
                    onClick={startRecording}
                    disabled={disabled}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    <Mic className="w-4 h-4" />
                    Bắt đầu nói
                </button>
            )}

            {isRecording && (
                <div className="flex items-center gap-4 animate-in fade-in">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full border border-red-100">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        <span className="font-mono font-medium">{formatTime(recordingTime)}</span>
                        <span className="text-xs">Đang ghi âm...</span>
                    </div>
                    <button
                        onClick={stopRecording}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition"
                        title="Dừng ghi âm"
                    >
                        <Square className="w-5 h-5 fill-slate-700" />
                    </button>
                </div>
            )}

            {audioUrl && !isRecording && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                    <audio src={audioUrl} controls className="h-10 rounded-full bg-slate-100" />
                    {!disabled && (
                        <button
                            onClick={resetRecording} // Simply resets to allow re-recording
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Thu lại
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
