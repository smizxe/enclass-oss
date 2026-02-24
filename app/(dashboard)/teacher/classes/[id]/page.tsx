import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    LayoutList,
    FileText,
    Settings,
    ClipboardList,
    Users,
    PenTool
} from "lucide-react";
import { PublishActions } from "./_components/publish-actions";
import { CreateAssignmentButton } from "./_components/create-assignment-button";

export default async function ClassIdPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    const classItem = await prisma.class.findUnique({
        where: {
            id,
        },
        include: {
            assignments: {
                orderBy: {
                    orderIndex: "asc"
                }
            }
        }
    });

    if (!classItem) {
        return redirect("/teacher");
    }

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/teacher/classes"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{classItem.title}</h1>
                            <p className="text-slate-500 mt-1">
                                {classItem.assignments.length} bài tập
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/teacher/classes/${classItem.id}/students`}>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
                                <Users className="w-4 h-4" />
                                Quản lý học viên
                            </button>
                        </Link>
                        <PublishActions classId={classItem.id} isPublished={classItem.published} />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Bài tập</div>
                    <div className="text-2xl font-bold text-slate-900">{classItem.assignments.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Học viên</div>
                    <div className="text-2xl font-bold text-slate-900">--</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Trạng thái</div>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${classItem.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-yellow-50 text-yellow-700"
                        }`}>
                        {classItem.published ? "Đang mở" : "Chưa kích hoạt"}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Class Info */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-medium text-slate-900 text-sm">Thông tin lớp học</span>
                            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                                <Settings className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Tên lớp học</div>
                                <div className="text-sm font-medium text-slate-900">{classItem.title}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Mô tả</div>
                                <div className="text-sm text-slate-600">{classItem.description || "Chưa có mô tả"}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignments List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-medium text-slate-900 text-sm">Nội dung lớp học</span>
                            <CreateAssignmentButton classId={classItem.id} />
                        </div>

                        {classItem.assignments.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center h-full pt-20">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <LayoutList className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">Chưa có bài tập nào</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {classItem.assignments.map((assignment, index) => (
                                    <Link
                                        href={`/teacher/classes/${classItem.id}/assignments/${assignment.id}`}
                                        key={assignment.id}
                                        className="flex items-center gap-3 p-4 hover:bg-slate-50 transition group"
                                    >
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition">{assignment.title}</span>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${assignment.type === 'LECTURE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    assignment.type === 'QUIZ' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        'bg-purple-50 text-purple-700 border-purple-100' // ESSAY
                                                    }`}>
                                                    {assignment.type === 'LECTURE' ? 'Bài giảng' :
                                                        assignment.type === 'QUIZ' ? 'Trắc nghiệm' : 'Viết'}
                                                </span>
                                            </div>
                                        </div>
                                        {assignment.type === "LECTURE" && <FileText className="w-4 h-4 text-slate-400" />}
                                        {assignment.type === "QUIZ" && <ClipboardList className="w-4 h-4 text-slate-400" />}
                                        {assignment.type === "ESSAY" && <PenTool className="w-4 h-4 text-slate-400" />}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
