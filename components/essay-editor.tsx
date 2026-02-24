"use client";

import { Textarea } from "@/components/ui/textarea";

interface EssayEditorProps {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function EssayEditor({ value, onChange, disabled, placeholder }: EssayEditorProps) {
    const wordCount = value.trim().split(/\s+/).filter(w => w.length > 0).length;

    return (
        <div className="space-y-2">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder || "Nhập bài làm của bạn tại đây..."}
                className="min-h-[200px] p-4 text-base leading-relaxed resize-y focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end text-xs text-slate-500">
                {wordCount} từ
            </div>
        </div>
    );
}
