"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    Loader2,
    Users,
    Mail,
    Calendar,
    Search,
    MoreHorizontal,
    PlusCircle,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ImportStudentModal from "./_components/import-student-modal";
import StudentDetailsDialog from "./_components/student-details-dialog";

interface Student {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: string;
    classMembers: {
        id: string;
        classId: string;
        class: {
            title: string;
        }
    }[];
}

interface ClassItem {
    id: string;
    title: string;
}

interface StudentsPageClientProps {
    initialStudents: Student[];
    initialPagination?: { page: number; limit: number; totalCount: number; totalPages: number };
    classes?: ClassItem[];
}

const ITEMS_PER_PAGE = 20;

export default function StudentsPageClient({ initialStudents, initialPagination, classes = [] }: StudentsPageClientProps) {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [pagination, setPagination] = useState(
        initialPagination || { page: 1, limit: ITEMS_PER_PAGE, totalCount: initialStudents.length, totalPages: 1 }
    );

    const handleViewDetails = (student: Student) => {
        setSelectedStudent(student);
        setIsDetailsOpen(true);
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch students when page, search, or classId changes
    const fetchStudents = useCallback(async (page = 1, search = "", classId = "") => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
            });
            if (search) params.set("search", search);
            if (classId) params.set("classId", classId);

            const response = await fetch(`/api/teacher/students?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                setStudents(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Re-fetch when search or filter changes (reset to page 1)
    useEffect(() => {
        fetchStudents(1, debouncedSearch, selectedClassId);
    }, [debouncedSearch, selectedClassId, fetchStudents]);

    const goToPage = (page: number) => {
        fetchStudents(page, debouncedSearch, selectedClassId);
    };

    // Generate page numbers for pagination UI
    const getPageNumbers = () => {
        const { page, totalPages } = pagination;
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push("...");
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý học viên</h1>
                    <p className="text-slate-500 mt-1">Theo dõi và quản lý danh sách học viên.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-emerald-600/25"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Import Excel
                    </button>
                    <Link href="/teacher/students/create">
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-indigo-600/25">
                            <PlusCircle className="w-4 h-4" />
                            Thêm học viên
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{pagination.totalCount}</div>
                        <div className="text-sm text-slate-500">Tổng học viên</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
                        <div className="text-sm text-slate-500">Lớp học</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{pagination.totalPages}</div>
                        <div className="text-sm text-slate-500">Trang</div>
                    </div>
                </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition bg-white"
                    />
                </div>
                {classes.length > 0 && (
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="pl-10 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition bg-white appearance-none cursor-pointer min-w-[200px]"
                        >
                            <option value="">Tất cả lớp</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>{cls.title}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Danh sách học viên</h2>
                    <span className="text-xs text-slate-400">
                        {pagination.totalCount > 0
                            ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.totalCount)} / ${pagination.totalCount}`
                            : "0 kết quả"
                        }
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">
                            {searchQuery || selectedClassId ? "Không tìm thấy kết quả" : "Chưa có học viên nào"}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {searchQuery || selectedClassId ? "Thử tìm kiếm hoặc thay đổi bộ lọc." : "Học viên sẽ xuất hiện khi họ đăng ký."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Học viên
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Lớp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Ngày tham gia
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                {student.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <div className="font-medium text-slate-900">
                                                {student.name || "Chưa đặt tên"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            {student.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {student.classMembers && student.classMembers.length > 0 ? (
                                                student.classMembers.map((member) => (
                                                    <span key={member.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        {member.class.title}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Chưa vào lớp</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {format(new Date(student.createdAt), "dd MMM yyyy", { locale: vi })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewDetails(student)}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                        >
                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={() => goToPage(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft className="w-4 h-4" /> Trước
                        </button>

                        <div className="flex items-center gap-1">
                            {getPageNumbers().map((pageNum, idx) => (
                                pageNum === "..." ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-slate-400">...</span>
                                ) : (
                                    <button
                                        key={pageNum}
                                        onClick={() => goToPage(pageNum as number)}
                                        disabled={loading}
                                        className={`w-9 h-9 text-sm rounded-lg transition font-medium ${pagination.page === pageNum
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            ))}
                        </div>

                        <button
                            onClick={() => goToPage(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Sau <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <ImportStudentModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => fetchStudents(pagination.page, debouncedSearch, selectedClassId)}
            />

            <StudentDetailsDialog
                student={selectedStudent}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={() => fetchStudents(pagination.page, debouncedSearch, selectedClassId)}
            />
        </div>
    );
}
