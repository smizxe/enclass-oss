import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTeacherDashboardData } from "./data";
import {
    PlusCircle,
    BookOpen,
    Users,
    TrendingUp,
    ChevronRight,
    Clock
} from "lucide-react";

export default async function TeacherDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    const { classes, stats } = await getTeacherDashboardData(session.user.id);

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Xin chao, Thay Diep!</h1>
                    <p className="text-slate-500 mt-1">Quan ly lop hoc va theo doi hoc vien.</p>
                </div>
                <Link href="/teacher/classes/create">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/25">
                        <PlusCircle className="w-4 h-4" />
                        Tao lop hoc moi
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            Tong cong
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.totalClasses}</div>
                    <div className="text-sm text-slate-500 mt-1">Lop hoc</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            Hoat dong
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.activeClasses}</div>
                    <div className="text-sm text-slate-500 mt-1">Da kich hoat</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            Hoc vien
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.totalStudents}</div>
                    <div className="text-sm text-slate-500 mt-1">Tong so hoc vien</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Danh sach lop hoc</h2>
                    <Link href="/teacher/classes" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        Xem tat ca
                    </Link>
                </div>

                {classes.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">Chua co lop hoc nao</h3>
                        <p className="text-sm text-slate-500 mb-4">Bat dau bang cach tao lop hoc dau tien.</p>
                        <Link href="/teacher/classes/create">
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
                                Tao lop hoc
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {classes.slice(0, 5).map((classItem) => (
                            <Link
                                href={`/teacher/classes/${classItem.id}`}
                                key={classItem.id}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition group"
                            >
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition">
                                    <BookOpen className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-slate-900 truncate">{classItem.title}</h3>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classItem.published
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-yellow-50 text-yellow-700"
                                            }`}>
                                            {classItem.published ? "Dang mo" : "Chua kich hoat"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">
                                        {classItem.description || "Chua co mo ta"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {new Date(classItem.createdAt).toLocaleDateString("vi-VN")}
                                    </div>
                                    <ChevronRight className="w-5 h-5 group-hover:text-indigo-600 transition" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
