"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Users,
    UserPlus,
    Loader2,
    Mail,
    Calendar,
    X
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ClassMember {
    id: string;
    joinedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        createdAt: string;
    };
}

export default function ClassStudentsPage() {
    const params = useParams();
    const router = useRouter();
    const [members, setMembers] = useState<ClassMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [studentEmail, setStudentEmail] = useState("");
    const [addingLoading, setAddingLoading] = useState(false);

    const classId = params.id as string;

    const fetchMembers = async () => {
        try {
            const response = await axios.get(`/api/teacher/classes/${classId}/members`);
            setMembers(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách học viên");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [classId]);

    const onAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentEmail) return;

        setAddingLoading(true);
        try {
            await axios.post(`/api/teacher/classes/${classId}/members`, {
                email: studentEmail
            });
            toast.success("Đã thêm học viên vào lớp");
            setStudentEmail("");
            setIsAdding(false);
            fetchMembers();
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.error("Không tìm thấy học viên với email này");
            } else {
                toast.error("Có lỗi xảy ra");
            }
        } finally {
            setAddingLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/teacher/classes/${classId}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại lớp học
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Danh sách học viên</h1>
                        <p className="text-slate-500 mt-1">Quản lý học viên trong lớp học này.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-indigo-600/25"
                    >
                        <UserPlus className="w-4 h-4" />
                        Thêm học viên
                    </button>
                </div>
            </div>

            {/* Add Student Modal / Form */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">Thêm học viên vào lớp</h3>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={onAddStudent} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email học viên
                                </label>
                                <input
                                    type="email"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    placeholder="student@example.com"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Nhập email của học viên đã có tài khoản trên hệ thống.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingLoading}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                                >
                                    {addingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Thêm vào lớp
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">Chưa có học viên nào</h3>
                        <p className="text-sm text-slate-500">
                            Thêm học viên bằng cách nhập email của họ.
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
                                    Ngày tham gia
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <div className="font-medium text-slate-900">
                                                {member.user.name || "Chưa đặt tên"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            {member.user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {format(new Date(member.joinedAt), "dd MMM yyyy", { locale: vi })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
