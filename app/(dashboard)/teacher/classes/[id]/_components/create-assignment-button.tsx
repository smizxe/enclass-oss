"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, Sparkles } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportExamModal } from "./import-exam-modal";

interface CreateAssignmentButtonProps {
    classId: string;
}

export const CreateAssignmentButton = ({ classId }: CreateAssignmentButtonProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const onCreate = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post("/api/teacher/assignments", {
                title: "Bài tập mới",
                classId,
                type: "QUIZ" // Default type, questions can be any type inside
            });

            toast.success("Đã tạo bài tập mới");
            router.refresh();
            // Navigate to editor
            router.push(`/teacher/classes/${classId}/assignments/${response.data.id}`);
        } catch {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                        Thêm bài tập
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={onCreate} className="cursor-pointer">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Thêm bài tập
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowImportModal(true)} className="cursor-pointer text-indigo-600">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Import bằng AI
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {showImportModal && (
                <ImportExamModal
                    classId={classId}
                    importType="MCQ"
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => router.refresh()}
                />
            )}
        </>
    );
};
