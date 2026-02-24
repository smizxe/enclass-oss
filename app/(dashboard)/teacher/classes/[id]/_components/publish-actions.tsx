"use client";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import { Loader2, Globe, EyeOff } from "lucide-react";

interface PublishActionsProps {
    classId: string;
    isPublished: boolean;
}

export const PublishActions = ({
    classId,
    isPublished
}: PublishActionsProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onClick = async () => {
        try {
            setIsLoading(true);
            const endpoint = `/api/teacher/classes/${classId}`;

            await axios.patch(endpoint, {
                published: !isPublished
            }); // Note: API logic inside [classId]/route.ts needs to handle this

            toast.success(isPublished ? "Đã ẩn lớp học" : "Đã kích hoạt lớp học");
            router.refresh();
        } catch {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition ${isPublished
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/25"
                }`}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPublished ? (
                <>
                    <EyeOff className="w-4 h-4" />
                    Hủy kích hoạt
                </>
            ) : (
                <>
                    <Globe className="w-4 h-4" />
                    Kích hoạt
                </>
            )}
        </button>
    );
};
