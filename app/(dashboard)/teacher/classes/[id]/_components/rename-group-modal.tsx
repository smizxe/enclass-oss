"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface RenameGroupModalProps {
    groupId: string;
    initialTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (groupId: string, newTitle: string) => void;
}

export const RenameGroupModal = ({ groupId, initialTitle, isOpen, onClose, onSuccess }: RenameGroupModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState(initialTitle);

    // Reset title when modal opens with new initialTitle
    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
        }
    }, [isOpen, initialTitle]);

    const handleSubmit = async () => {
        if (!title.trim() || title.trim() === initialTitle) {
            onClose();
            return;
        }

        setIsLoading(true);
        try {
            await axios.put(`/api/teacher/groups/${groupId}`, {
                title: title.trim()
            });

            toast.success("Đã đổi tên nhóm");
            onSuccess(groupId, title.trim());
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi đổi tên nhóm");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Đổi tên nhóm</DialogTitle>
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
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            className="col-span-3"
                            placeholder="Nhập tên nhóm mới..."
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !title.trim() || title.trim() === initialTitle}>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
