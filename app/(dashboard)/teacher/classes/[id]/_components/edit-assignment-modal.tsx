"use client";

import { useState, useEffect } from "react";
import { X, Loader2, RefreshCw } from "lucide-react";
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
        [key: string]: any;
    };
    onClose: () => void;
    onSuccess: (newTitle: string, newSettings: any) => void;
}

export const EditAssignmentModal = ({
    assignmentId,
    initialTitle,
    initialSettings = {},
    onClose,
    onSuccess
}: AssignmentSettingsModalProps) => {
    const [title, setTitle] = useState(initialTitle);
    const [maxAttempts, setMaxAttempts] = useState(initialSettings?.maxAttempts || 1);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            // Merge new settings with existing ones
            const newSettings = {
                ...initialSettings,
                maxAttempts: maxAttempts
            };

            await axios.patch(`/api/teacher/assignments/${assignmentId}`, {
                title: title,
                settings: newSettings
            });
            toast.success("Cập nhật thành công");
            onSuccess(title, newSettings);
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
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
