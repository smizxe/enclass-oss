"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { EditClassModal } from "./edit-class-modal";
import { useRouter } from "next/navigation";

interface ClassInfoCardProps {
    classId: string;
    title: string;
    description: string | null;
}

export const ClassInfoCard = ({
    classId,
    title: initialTitle,
    description: initialDescription
}: ClassInfoCardProps) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-900 text-sm">Thông tin lớp học</span>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                >
                    <Settings className="w-4 h-4 text-slate-400" />
                </button>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <div className="text-xs text-slate-500 mb-1">Tên lớp học</div>
                    <div className="text-sm font-medium text-slate-900">{title}</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500 mb-1">Mô tả</div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap">{description || "Chưa có mô tả"}</div>
                </div>
            </div>

            {isEditing && (
                <EditClassModal
                    classId={classId}
                    initialTitle={title}
                    initialDescription={description}
                    onClose={() => setIsEditing(false)}
                    onSuccess={(newTitle, newDesc) => {
                        setTitle(newTitle);
                        setDescription(newDesc);
                        router.refresh(); // Refresh server components if needed (e.g. breadcrumbs or header title)
                    }}
                />
            )}
        </div>
    );
};
