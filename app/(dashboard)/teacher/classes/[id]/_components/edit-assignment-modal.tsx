"use client";

import { useState } from "react";
import { X, Loader2, RefreshCw, Clock, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import toast from "react-hot-toast";

interface AssignmentSettingsModalProps {
    assignmentId: string;
    initialTitle: string;
    initialSettings?: {
        maxAttempts?: number;
        audioUrl?: string;
        timeLimitMinutes?: number;
        deadline?: string;
        [key: string]: any;
    };
    initialIsTestMode?: boolean;
    onClose: () => void;
    onSuccess: (newTitle: string, newSettings: any, newIsTestMode: boolean) => void;
}

export const EditAssignmentModal = ({
    assignmentId,
    initialTitle,
    initialSettings = {},
    initialIsTestMode = false,
    onClose,
    onSuccess
}: AssignmentSettingsModalProps) => {
    const [title, setTitle] = useState(initialTitle);
    const [maxAttempts, setMaxAttempts] = useState(initialSettings?.maxAttempts || 1);
    const [isTestMode, setIsTestMode] = useState(initialIsTestMode);
    const [isLoading, setIsLoading] = useState(false);

    // Time Limit: hours + minutes
    const initialTotalMinutes = initialSettings?.timeLimitMinutes || 0;
    const [timeLimitHours, setTimeLimitHours] = useState(Math.floor(initialTotalMinutes / 60));
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialTotalMinutes % 60);

    // Deadline
    const [deadline, setDeadline] = useState(
        initialSettings?.deadline
            ? new Date(initialSettings.deadline).toISOString().slice(0, 16) // Format for datetime-local
            : ""
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            const totalMinutes = timeLimitHours * 60 + timeLimitMinutes;

            const newSettings = {
                ...initialSettings,
                maxAttempts: maxAttempts,
                timeLimitMinutes: totalMinutes > 0 ? totalMinutes : undefined,
                deadline: deadline ? new Date(deadline).toISOString() : undefined,
            };

            // Clean up undefined values
            if (!newSettings.timeLimitMinutes) delete newSettings.timeLimitMinutes;
            if (!newSettings.deadline) delete newSettings.deadline;

            await axios.patch(`/api/teacher/assignments/${assignmentId}`, {
                title: title,
                settings: newSettings,
                isTestMode: isTestMode
            });
            toast.success("Cập nhật thành công");
            onSuccess(title, newSettings, isTestMode);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-slate-900">Cài đặt bài tập</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tên bài tập
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nhập tên bài tập..."
                            autoFocus
                        />
                    </div>

                    {/* Test Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                            <label className="text-sm font-medium text-slate-900 block">Chế độ kiểm tra (Test Mode)</label>
                            <span className="text-xs text-slate-500">Xáo trộn câu hỏi, học sinh không biết trước thứ tự.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isTestMode}
                                onChange={(e) => setIsTestMode(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* Max Attempts */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-indigo-500" />
                                Số lần làm bài tối đa
                            </div>
                        </label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={maxAttempts}
                                onChange={(e) => setMaxAttempts(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-24"
                            />
                            <span className="text-sm text-slate-500">
                                {maxAttempts === 1 ? "(Không cho làm lại)" : `(Cho phép làm lại ${maxAttempts - 1} lần)`}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Điểm cao nhất trong các lần làm sẽ được tính vào bảng điểm
                        </p>
                    </div>

                    {/* Time Limit */}
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600" />
                                Giới hạn thời gian làm bài
                            </div>
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    min={0}
                                    max={5}
                                    value={timeLimitHours}
                                    onChange={(e) => setTimeLimitHours(Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                                    className="w-20 text-center"
                                />
                                <span className="text-sm text-slate-600">giờ</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={timeLimitMinutes}
                                    onChange={(e) => setTimeLimitMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    className="w-20 text-center"
                                />
                                <span className="text-sm text-slate-600">phút</span>
                            </div>
                        </div>
                        <p className="text-xs text-amber-700 mt-2">
                            {timeLimitHours === 0 && timeLimitMinutes === 0
                                ? "Để trống = không giới hạn thời gian"
                                : `⏱️ Học sinh có ${timeLimitHours > 0 ? `${timeLimitHours} giờ ` : ""}${timeLimitMinutes > 0 ? `${timeLimitMinutes} phút` : ""} để hoàn thành`
                            }
                        </p>
                    </div>

                    {/* Deadline */}
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <div className="flex items-center gap-2">
                                <CalendarClock className="w-4 h-4 text-red-500" />
                                Hạn nộp bài (Deadline)
                            </div>
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="flex-1"
                            />
                            {deadline && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeadline("")}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2"
                                >
                                    Xóa
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-red-600 mt-2">
                            {deadline
                                ? `📅 Học sinh phải nộp trước: ${new Date(deadline).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}`
                                : "Để trống = không có hạn nộp"
                            }
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={!title.trim() || isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu thay đổi
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
