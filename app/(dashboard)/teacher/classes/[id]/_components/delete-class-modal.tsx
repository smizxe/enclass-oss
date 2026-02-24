"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteClassModalProps {
    classId: string;
    classTitle: string;
}

export const DeleteClassModal = ({
    classId,
    classTitle,
}: DeleteClassModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const router = useRouter();

    const isConfirmValid = confirmText === "DELETE";

    const onDelete = async () => {
        if (!isConfirmValid) return;

        try {
            setIsLoading(true);
            await axios.delete(`/api/teacher/classes/${classId}`);

            toast.success("Đã xoá lớp học thành công");
            setIsOpen(false);

            // Redirect to classes list since this class no longer exists
            router.push("/teacher/classes");
            router.refresh();
        } catch {
            toast.error("Đã xảy ra lỗi khi xoá lớp học. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!isLoading) {
                setIsOpen(open);
                if (!open) setConfirmText(""); // Reset when closed
            }
        }}>
            <DialogTrigger asChild>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-red-800 font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Khu vực nguy hiểm (Danger Zone)
                        </h3>
                        <p className="text-red-600 text-sm mt-1">
                            Xoá lớp học này sẽ xoá vĩnh viễn toàn bộ dữ liệu, bao gồm học viên, bài tập, điểm số và bài viết. Bạn không thể hoàn tác thao tác này.
                        </p>
                    </div>
                    <button
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xoá lớp học
                    </button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Cảnh báo xoá hoàn toàn lớp học
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-3">
                        <p>
                            Bạn đang chuẩn bị xoá lớp học <strong>"{classTitle}"</strong>.
                        </p>
                        <p>
                            Thao tác này là <span className="font-semibold text-slate-900">vĩnh viễn và không thể khôi phục</span>.
                            Toàn bộ dữ liệu sau sẽ bị hệ thống xoá sạch:
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-1 text-slate-600">
                            <li>Danh sách thành viên lớp</li>
                            <li>Tất cả bài tập, câu hỏi, điểm số, bài nộp</li>
                            <li>Các bài viết và bình luận trong bảng tin Cộng đồng</li>
                            <li>Tất cả file đính kèm, ảnh và Audio</li>
                        </ul>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <label className="text-sm font-medium text-slate-900">
                        Vui lòng nhập chữ <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-bold">DELETE</span> để xác nhận xoá:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Nhập chữ DELETE"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50"
                        disabled={isLoading}
                    />
                </div>

                <DialogFooter className="sm:justify-between items-center bg-slate-50 border-t border-slate-100 p-4 -mx-6 -mb-6 rounded-b-[inherit]">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 bg-slate-100 rounded-xl transition disabled:opacity-50"
                    >
                        Trở lại
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={!isConfirmValid || isLoading}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang xoá...
                            </>
                        ) : (
                            <>Xác nhận Xoá Lớp</>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
