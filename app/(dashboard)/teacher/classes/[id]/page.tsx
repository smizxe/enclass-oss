import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    Users,
} from "lucide-react";
import { PublishActions } from "./_components/publish-actions";
import { CreateAssignmentButton } from "./_components/create-assignment-button";
import { AssignmentsList } from "./_components/assignments-list";
import { ClassInfoCard } from "./_components/class-info-card";

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
                    <ClassInfoCard
                        classId={classItem.id}
                        title={classItem.title}
                        description={classItem.description}
                    />
                </div>

                {/* Assignments List */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium text-slate-700">Nội dung lớp học</h2>
                        <CreateAssignmentButton classId={classItem.id} />
                    </div>

                    <AssignmentsList
                        classId={classItem.id}
                        initialAssignments={classItem.assignments}
                    />
                </div>
            </div>
        </div>
    );
}
