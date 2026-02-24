"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createClass, updateClass } from "@/app/actions/teacher/classes";
import { useRouter } from "next/navigation";

interface ClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classToEdit?: { id: string; title: string; description: string | null } | null;
    onSuccess: () => void;
}

export default function ClassDialog({
    open,
    onOpenChange,
    classToEdit,
    onSuccess,
}: ClassDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (classToEdit) {
            setTitle(classToEdit.title);
            setDescription(classToEdit.description || "");
        } else {
            setTitle("");
            setDescription("");
        }
    }, [classToEdit, open]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (classToEdit) {
                const res = await updateClass(classToEdit.id, { title, description });
                if (res.success) {
                    toast.success("Cập nhật lớp học thành công");
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(res.error || "Có lỗi xảy ra");
                }
            } else {
                const res = await createClass({ title, description });
                if (res.success) {
                    toast.success("Tạo lớp học thành công");
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(res.error || "Có lỗi xảy ra");
                }
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{classToEdit ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}</DialogTitle>
                    <DialogDescription>
                        {classToEdit
                            ? "Thay đổi thông tin lớp học của bạn."
                            : "Nhập thông tin để tạo lớp học mới."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Tên lớp học <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Lớp IELTS Intensive"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn về lớp học..."
                            className="resize-none"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            {classToEdit ? "Lưu thay đổi" : "Tạo lớp học"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
