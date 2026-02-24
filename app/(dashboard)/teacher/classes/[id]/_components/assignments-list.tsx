"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Assignment } from "@prisma/client";
import {
    FileText,
    ClipboardList,
    PenTool,
    MoreVertical,
    Pencil,
    Trash2,
    Loader2,
    LayoutList,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditAssignmentModal } from "./edit-assignment-modal";
import axios from "axios";
import toast from "react-hot-toast";

interface AssignmentsListProps {
    classId: string;
    initialAssignments: (Assignment & { settings?: any })[];
}

export const AssignmentsList = ({ classId, initialAssignments }: AssignmentsListProps) => {
    const router = useRouter();
    const [assignments, setAssignments] = useState(initialAssignments);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<{
        id: string;
        title: string;
        settings?: any;
    } | null>(null);

    // Toggle Select All
    const toggleSelectAll = () => {
        if (selectedIds.size === assignments.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(assignments.map(a => a.id)));
        }
    };

    // Toggle Single Row
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.size} bài tập đã chọn?`)) return;

        setIsDeleting(true);
        try {
            await axios.post(`/api/teacher/classes/${classId}/assignments/bulk-delete`, {
                assignmentIds: Array.from(selectedIds)
            });

            setAssignments(prev => prev.filter(a => !selectedIds.has(a.id)));
            setSelectedIds(new Set());
            toast.success("Đã xóa các bài tập đã chọn");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xóa bài tập");
        } finally {
            setIsDeleting(false);
        }
    };

    // Single Delete
    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa bài tập này?")) return;

        // Optimistic update
        const prevAssignments = [...assignments];
        setAssignments(prev => prev.filter(a => a.id !== id));

        try {
            await axios.delete(`/api/teacher/assignments/${id}`);
            toast.success("Đã xóa bài tập");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xóa bài tập");
            setAssignments(prevAssignments); // Rollback
        }
    };

    // Get max attempts from settings
    const getMaxAttempts = (settings: any): number => {
        if (!settings) return 1;
        return settings.maxAttempts || 1;
    };

    if (assignments.length === 0) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full pt-20">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <LayoutList className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Chưa có bài tập nào</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
            {/* Header / Toolbar */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={selectedIds.size === assignments.length && assignments.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                    />
                    <span className="text-sm font-medium text-slate-700">
                        {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size}` : "Danh sách bài tập"}
                    </span>
                </div>

                {selectedIds.size > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="h-8 text-xs"
                    >
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                        Xóa {selectedIds.size} mục
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
                {assignments.map((assignment, index) => {
                    const maxAttempts = getMaxAttempts(assignment.settings);

                    return (
                        <div
                            key={assignment.id}
                            className={`flex items-center gap-3 p-4 hover:bg-slate-50 transition group ${selectedIds.has(assignment.id) ? "bg-slate-50" : ""}`}
                        >
                            <Checkbox
                                checked={selectedIds.has(assignment.id)}
                                onCheckedChange={() => toggleSelect(assignment.id)}
                                onClick={(e) => e.stopPropagation()}
                            />

                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                                {index + 1}
                            </div>

                            <Link
                                href={`/teacher/classes/${classId}/assignments/${assignment.id}`}
                                className="flex-1 flex items-center gap-3 min-w-0"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition truncate block">
                                            {assignment.title}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${assignment.type === 'LECTURE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            assignment.type === 'QUIZ' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                'bg-purple-50 text-purple-700 border-purple-100'
                                            }`}>
                                            {assignment.type === 'LECTURE' ? 'Bài giảng' :
                                                assignment.type === 'QUIZ' ? 'Trắc nghiệm' : 'Viết'}
                                        </span>

                                        {/* Max Attempts Badge */}
                                        {maxAttempts > 1 && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 shrink-0">
                                                <RefreshCw className="w-2.5 h-2.5" />
                                                {maxAttempts} lần
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {assignment.type === "LECTURE" && <FileText className="w-4 h-4 text-slate-400 shrink-0" />}
                                {assignment.type === "QUIZ" && <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />}
                                {assignment.type === "ESSAY" && <PenTool className="w-4 h-4 text-slate-400 shrink-0" />}
                            </Link>

                            {/* Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingAssignment({
                                        id: assignment.id,
                                        title: assignment.title,
                                        settings: assignment.settings
                                    })}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Cài đặt
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(assignment.id)}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Xóa
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                })}
            </div>

            {editingAssignment && (
                <EditAssignmentModal
                    assignmentId={editingAssignment.id}
                    initialTitle={editingAssignment.title}
                    initialSettings={editingAssignment.settings}
                    onClose={() => setEditingAssignment(null)}
                    onSuccess={(newTitle, newSettings) => {
                        setAssignments(prev => prev.map(a =>
                            a.id === editingAssignment.id
                                ? { ...a, title: newTitle, settings: newSettings }
                                : a
                        ));
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
};
