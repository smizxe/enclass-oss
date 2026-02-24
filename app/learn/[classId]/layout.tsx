import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ClassSidebar } from "./_components/class-sidebar";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default async function ClassLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { classId: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect("/");
    }

    const classItem = await prisma.class.findUnique({
        where: {
            id: params.classId,
        },
        include: {
            assignments: {
                orderBy: {
                    orderIndex: "asc",
                },
                include: {
                    progress: {
                        where: {
                            userId: session.user.id
                        }
                    }
                }
            },
        },
    });

    if (!classItem) {
        return redirect("/");
    }

    return (
        <div className="h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="hidden md:flex w-80 flex-col border-r border-slate-200 bg-white">
                <ClassSidebar
                    classItem={classItem}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/student"
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Link>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="font-medium text-slate-900 text-sm">{classItem.title}</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
