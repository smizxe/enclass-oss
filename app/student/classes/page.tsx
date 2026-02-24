import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
    BookOpen,
    PlayCircle,
    CheckCircle2,
    Clock,
    ChevronRight,
    GraduationCap
} from "lucide-react";
import { getStudentDashboardData } from "../data";

export default async function StudentClassesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect("/");
    }

    const data = await getStudentDashboardData();
    const classes = data?.classes || [];

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lớp học của tôi</h1>
                        <p className="text-slate-500">Quản lý và theo dõi tiến độ các lớp bạn đang tham gia</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
                            <div className="text-xs text-slate-500">Tổng số lớp</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {classes.reduce((sum, c) => sum + c.completedAssignments, 0)}
                            </div>
                            <div className="text-xs text-slate-500">Bài đã hoàn thành</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {classes.reduce((sum, c) => sum + (c.totalAssignments - c.completedAssignments), 0)}
                            </div>
                            <div className="text-xs text-slate-500">Bài chưa làm</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa tham gia lớp học nào</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Liên hệ giáo viên để được thêm vào lớp học. Sau khi được thêm, các lớp sẽ hiển thị tại đây.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classes.map((classItem) => (
                        <div
                            key={classItem.id}
                            className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-200 transition group flex flex-col h-full"
                        >
                            {/* Compact Header */}
                            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"></div>

                            <div className="p-5 flex-1 flex flex-col">
                                {/* Title & Description */}
                                <div className="mb-4 flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1 mb-1">
                                        {classItem.title}
                                    </h3>
                                    {/* <p className="text-xs text-slate-500 line-clamp-2">
                                        {classItem.description || "Không có mô tả"}
                                    </p> */}
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>{classItem.totalAssignments} bài tập</span>
                                    </div>
                                </div>

                                {/* Progress Section - Compact */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <span className="text-xs font-medium text-slate-500">Tiến độ</span>
                                        <span className="text-sm font-bold text-indigo-600">{classItem.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                            style={{ width: `${classItem.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Stats Row - Compact */}
                                <div className="flex items-center justify-between text-xs text-slate-600 mb-4 bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>{classItem.completedAssignments} xong</span>
                                    </div>
                                    <div className="w-px h-3 bg-slate-300"></div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                                        <span>{classItem.totalAssignments - classItem.completedAssignments} chưa</span>
                                    </div>
                                </div>

                                {/* Action Button - Compact */}
                                <Link href={`/learn/${classItem.id}`} className="mt-auto">
                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 font-medium rounded-lg transition text-sm group-hover:border-indigo-200">
                                        <PlayCircle className="w-4 h-4" />
                                        Vào học
                                        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
