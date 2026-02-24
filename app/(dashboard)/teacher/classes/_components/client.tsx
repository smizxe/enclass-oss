"use client";

import { useState } from "react";
import { PlusCircle, Pencil, Trash2, Search, MoreHorizontal, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { deleteClass } from "@/app/actions/teacher/classes";
import ClassDialog from "./class-dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ClassItem {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
    _count: {
        members: number;
    };
}

interface ClassesClientProps {
    data: ClassItem[];
}

export default function ClassesClient({ data }: ClassesClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [classToEdit, setClassToEdit] = useState<ClassItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredClasses = data.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = () => {
        setClassToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (item: ClassItem) => {
        setClassToEdit(item);
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteClass(deleteId);
            if (res.success) {
                toast.success("Xóa lớp học thành công");
                router.refresh();
            } else {
                toast.error(res.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý lớp học</h1>
                    <p className="text-slate-500 mt-1">Quản lý danh sách lớp học của bạn.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm lớp học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-[250px] bg-white"
                        />
                    </div>
                    <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Tạo lớp học
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên lớp</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead className="text-center">Học viên</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClasses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <BookOpen className="w-8 h-8 mb-2 text-slate-400" />
                                        <p>Chưa có lớp học nào</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClasses.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/teacher/classes/${item.id}`} className="hover:text-indigo-600 hover:underline transition">
                                            {item.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-slate-500">
                                        {item.description || "Không có mô tả"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {item._count.members}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: vi })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link href={`/teacher/classes/${item.id}`}>
                                                    <DropdownMenuItem>
                                                        <BookOpen className="mr-2 h-4 w-4" />
                                                        Chi tiết
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Xóa lớp
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ClassDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                classToEdit={classToEdit}
                onSuccess={() => router.refresh()}
            />

            <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bạn có chắc chắn muốn xóa?</DialogTitle>
                        <DialogDescription>
                            Hành động này không thể hoàn tác. Lớp học và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>Hủy</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa lớp học"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
