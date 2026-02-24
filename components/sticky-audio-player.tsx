"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Maximize2, Minimize2, AudioWaveform } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface StickyAudioPlayerProps {
    src: string | null;
}

export const StickyAudioPlayer = ({ src }: StickyAudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!src) {
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
        }
    }, [src]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (!src) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-indigo-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 z-50 ${isExpanded ? 'h-24' : 'h-12'}`}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            <div className="container mx-auto h-full px-4 flex flex-col justify-center">
                {/* Minimized View */}
                {!isExpanded && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={togglePlay}
                                className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition"
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            <span className="text-sm font-medium text-slate-700">Listening Audio</span>
                            <span className="text-xs text-slate-500">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <button onClick={() => setIsExpanded(true)} className="text-slate-400 hover:text-indigo-600">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Expanded View */}
                {isExpanded && (
                    <div className="flex items-center justify-between gap-6">
                        {/* Playback Controls */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-lg ring-4 ring-indigo-50"
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                            </button>
                            <div className="hidden md:block">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                    <AudioWaveform className="w-4 h-4 text-indigo-500" />
                                    Listening Part
                                </h4>
                                <p className="text-xs text-slate-500">Focus on the audio</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1 flex items-center gap-3">
                            <span className="text-xs font-mono text-slate-500 w-10 text-right">{formatTime(currentTime)}</span>
                            <Slider
                                value={[currentTime]}
                                max={duration}
                                step={1}
                                onValueChange={handleSeek}
                                className="flex-1 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-slate-500 w-10">{formatTime(duration)}</span>
                        </div>

                        {/* Volume & Minimize */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 w-32">
                                <Volume2 className="w-4 h-4 text-slate-400" />
                                <Slider
                                    value={[volume * 100]}
                                    max={100}
                                    onValueChange={(val) => {
                                        const newVol = val[0] / 100;
                                        setVolume(newVol);
                                        if (audioRef.current) audioRef.current.volume = newVol;
                                    }}
                                />
                            </div>
                            <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-indigo-600">
                                <Minimize2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
