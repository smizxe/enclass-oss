"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface CopyAssignmentModalProps {
    classId: string; // The current class where the assignment resides (to exclude from list)
    assignmentId: string;
    assignmentTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export const CopyAssignmentModal = ({
    classId,
    assignmentId,
    assignmentTitle,
    isOpen,
    onClose,
}: CopyAssignmentModalProps) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            fetchClasses();
            setSelectedClassIds(new Set());
        }
    }, [isOpen]);

    const fetchClasses = async () => {
        try {
            setIsLoadingClasses(true);
            const res = await axios.get("/api/teacher/classes");
            // Exclude the current class
            const availableClasses = res.data.filter((c: any) => c.id !== classId);
            setClasses(availableClasses);
        } catch (error) {
            toast.error("Không thể tải danh sách lớp học");
        } finally {
            setIsLoadingClasses(false);
        }
    };

    const toggleClass = (id: string) => {
        const newSelected = new Set(selectedClassIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedClassIds(newSelected);
    };

    const onSubmit = async () => {
        if (selectedClassIds.size === 0) {
            toast.error("Vui lòng chọn ít nhất một lớp đích");
            return;
        }

        try {
            setIsSubmitting(true);
            await axios.post(`/api/teacher/assignments/${assignmentId}/copy`, {
                targetClassIds: Array.from(selectedClassIds),
            });
            toast.success("Sao chép bài tập thành công");
            router.refresh();
            onClose();
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi sao chép");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="w-5 h-5 text-indigo-600" />
                        Sao chép bài tập
                    </DialogTitle>
                    <DialogDescription>
                        Nhân bản bài tập <span className="font-semibold text-slate-900">"{assignmentTitle}"</span> sang các lớp học khác.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="text-sm font-medium text-slate-700">Chọn lớp đích:</div>

                    {isLoadingClasses ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="text-sm text-slate-500 italic text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                            Bạn không có lớp học nào khác để sao chép.
                        </div>
                    ) : (
                        <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
                            {classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedClassIds.has(cls.id)
                                            ? "bg-indigo-50 border-indigo-200"
                                            : "bg-white border-slate-200 hover:border-indigo-100"
                                        }`}
                                    onClick={() => toggleClass(cls.id)}
                                >
                                    <Checkbox
                                        checked={selectedClassIds.has(cls.id)}
                                        onCheckedChange={() => toggleClass(cls.id)}
                                        className={selectedClassIds.has(cls.id) ? "border-indigo-600 bg-indigo-600" : ""}
                                    />
                                    <span className={`text-sm font-medium ${selectedClassIds.has(cls.id) ? "text-indigo-900" : "text-slate-700"}`}>
                                        {cls.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isSubmitting || selectedClassIds.size === 0 || classes.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang sao chép...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Xác nhận {selectedClassIds.size > 0 ? `(${selectedClassIds.size})` : ""}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
