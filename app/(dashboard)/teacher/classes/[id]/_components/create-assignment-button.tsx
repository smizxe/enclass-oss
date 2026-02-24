"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, FileText, ClipboardList, PenTool, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreateAssignmentButtonProps {
    classId: string;
}

export const CreateAssignmentButton = ({ classId }: CreateAssignmentButtonProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onClick = async (type: "LECTURE" | "QUIZ" | "ESSAY") => {
        try {
            setIsLoading(true);
            const title = type === "LECTURE" ? "Bài giảng mới" : type === "QUIZ" ? "Bài tập trắc nghiệm" : "Bài viết mới";

            const response = await axios.post("/api/teacher/assignments", {
                title,
                classId,
                type
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
                <DropdownMenuItem onClick={() => onClick("LECTURE")} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Bài giảng (Lecture)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onClick("QUIZ")} className="cursor-pointer">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Trắc nghiệm (Quiz)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onClick("ESSAY")} className="cursor-pointer">
                    <PenTool className="w-4 h-4 mr-2" />
                    Bài viết (Essay)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
