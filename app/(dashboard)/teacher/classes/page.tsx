import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlusCircle, BookOpen, Pencil } from "lucide-react";



export default async function ClassesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect("/");
    }

    const classes = await prisma.class.findMany({
        where: {
            teacherId: session.user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            _count: {
                select: { members: true }
            }
        }
    });

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Quản lý lớp học</h1>
                <Link href="/teacher/classes/create">
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                        <PlusCircle className="w-5 h-5" />
                        Tạo lớp học mới
                    </button>
                </Link>
            </div>

            {classes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có lớp học nào</h3>
                    <p className="text-slate-500 mb-4">Hãy tạo lớp học đầu tiên của bạn để bắt đầu giảng dạy.</p>
                    <Link href="/teacher/classes/create">
                        <button className="text-indigo-600 font-medium hover:underline">
                            + Tạo lớp học ngay
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
                        >
                            {/* Cover Image Placeholder */}
                            <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDUpIi8+PC9zdmc+')] opacity-50"></div>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-semibold text-slate-700">
                                    {item.published ? (
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Đang mở
                                        </span>
                                    ) : (
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            Nháp
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition">
                                    <Link href={`/teacher/classes/${item.id}`}>
                                        {item.title}
                                    </Link>
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                                    {item.description || "Không có mô tả"}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="text-xs text-slate-500">
                                        {item._count.members} học viên
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/teacher/classes/${item.id}`}>
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
