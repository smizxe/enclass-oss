"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
    Loader2,
    Users,
    Mail,
    Calendar,
    Search,
    MoreHorizontal,
    PlusCircle,
    FileSpreadsheet
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

interface StudentsPageClientProps {
    initialStudents: Student[];
}

export default function StudentsPageClient({ initialStudents }: StudentsPageClientProps) {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleViewDetails = (student: Student) => {
        setSelectedStudent(student);
        setIsDetailsOpen(true);
    };

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/teacher/students");
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredStudents = students.filter((student) =>
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quan ly hoc vien</h1>
                    <p className="text-slate-500 mt-1">Theo doi va quan ly danh sach hoc vien.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tim kiem hoc vien..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                        />
                    </div>
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
                            Them hoc vien
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
                        <div className="text-2xl font-bold text-slate-900">{students.length}</div>
                        <div className="text-sm text-slate-500">Tong hoc vien</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">--</div>
                        <div className="text-sm text-slate-500">Dang hoat dong</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">--</div>
                        <div className="text-sm text-slate-500">Moi trong thang</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900">Danh sach hoc vien</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">
                            {searchQuery ? "Khong tim thay ket qua" : "Chua co hoc vien nao"}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {searchQuery ? "Thu tim kiem voi tu khoa khac." : "Hoc vien se xuat hien khi ho dang ky."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Hoc vien
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Lop
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Ngay tham gia
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Thao tac
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                {student.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <div className="font-medium text-slate-900">
                                                {student.name || "Chua dat ten"}
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
                                                <span className="text-slate-400 text-xs italic">Chua vao lop</span>
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
            </div>

            <ImportStudentModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchStudents}
            />

            <StudentDetailsDialog
                student={selectedStudent}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={fetchStudents}
            />
        </div>
    );
}
