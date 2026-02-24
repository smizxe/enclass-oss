"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CreateGroupModalProps {
    classId: string;
    onSuccess?: (group: any) => void;
}

export const CreateGroupModal = ({ classId, onSuccess }: CreateGroupModalProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");

    const handleSubmit = async () => {
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            const response = await axios.post(`/api/teacher/classes/${classId}/groups`, {
                title
            });

            toast.success("Tạo nhóm thành công!");
            setOpen(false);
            setTitle("");
            onSuccess?.(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tạo nhóm");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nhóm
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tạo nhóm bài tập mới</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Tên nhóm
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                            placeholder="Ví dụ: Unit 1, Grammar..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !title.trim()}>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Tạo nhóm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
