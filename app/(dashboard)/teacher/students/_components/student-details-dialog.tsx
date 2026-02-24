"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Plus, UserCog, Shield, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import {
    updateStudent,
    changeStudentPassword,
    addStudentToClass,
    removeStudentFromClass,
    getAvailableClasses,
} from "@/app/actions/teacher/student-crud";
import { useRouter } from "next/navigation";

// Mimic the Student interface from the page, but ensure it handles what we need
interface Student {
    id: string;
    name: string | null;
    email: string | null;
    classMembers: {
        id: string; // classMember id
        classId: string;
        class: {
            title: string;
        };
    }[];
}

interface StudentDetailsDialogProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export default function StudentDetailsDialog({
    student,
    open,
    onOpenChange,
    onUpdate,
}: StudentDetailsDialogProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState<{ id: string; title: string }[]>([]);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");

    useEffect(() => {
        if (student) {
            setName(student.name || "");
            setEmail(student.email || "");
            setNewPassword("");
            setConfirmPassword("");
            setSelectedClassId("");
        }
    }, [student]);

    useEffect(() => {
        if (open) {
            fetchClasses();
        }
    }, [open]);

    const fetchClasses = async () => {
        const classes = await getAvailableClasses();
        setAvailableClasses(classes);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;

        setIsLoading(true);
        try {
            const result = await updateStudent(student.id, { name, email });
            if (result.success) {
                toast.success("Cập nhật thông tin thành công");
                onUpdate();
            } else {
                toast.error("Cập nhật thất bại");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;

        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setIsLoading(true);
        try {
            const result = await changeStudentPassword(student.id, newPassword);
            if (result.success) {
                toast.success("Đổi mật khẩu thành công");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error("Đổi mật khẩu thất bại");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClass = async () => {
        if (!student || !selectedClassId) return;

        // Check if already in class
        if (student.classMembers.some((m) => m.classId === selectedClassId)) {
            toast.error("Học viên đã ở trong lớp này");
            return;
        }

        setIsLoading(true);
        try {
            const result = await addStudentToClass(student.id, selectedClassId);
            if (result.success) {
                toast.success("Thêm vào lớp thành công");
                setSelectedClassId("");
                onUpdate();
            } else {
                toast.error("Thêm vào lớp thất bại");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFromClass = async (classId: string) => {
        if (!student) return;

        if (!confirm("Bạn có chắc muốn xóa học viên khỏi lớp này?")) return;

        setIsLoading(true);
        try {
            const result = await removeStudentFromClass(student.id, classId);
            if (result.success) {
                toast.success("Đã xóa khỏi lớp");
                onUpdate();
            } else {
                toast.error("Xóa khỏi lớp thất bại");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    if (!student) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chi tiết học viên</DialogTitle>
                    <DialogDescription>
                        Quản lý thông tin, lớp học và bảo mật cho {student.name || student.email}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <UserCog className="w-4 h-4" />
                            Thông tin chung
                        </TabsTrigger>
                        <TabsTrigger value="classes" className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Lớp học
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Bảo mật
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Họ và tên</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nhập tên học viên"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="classes" className="space-y-4 py-4">
                        <div className="flex items-center gap-2 mb-4">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                <option value="">Chọn lớp để thêm...</option>
                                {availableClasses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>
                            <Button onClick={handleAddClass} disabled={!selectedClassId || isLoading}>
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Lớp đã tham gia</Label>
                            {student.classMembers.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">Chưa tham gia lớp nào</p>
                            ) : (
                                <div className="space-y-2">
                                    {student.classMembers.map((member) => (
                                        <div
                                            key={member.classId}
                                            className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                                        >
                                            <span className="font-medium">{member.class.title}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleRemoveFromClass(member.classId)}
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 py-4">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Mật khẩu mới</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isLoading} variant="destructive">
                                    {isLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                                    Đổi mật khẩu
                                </Button>
                            </div>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
