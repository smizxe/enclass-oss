import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function ClassIdPage({
    params
}: {
    params: { classId: string; }
}) {
    const classItem = await prisma.class.findUnique({
        where: {
            id: params.classId,
        },
        include: {
            modules: {
                orderBy: {
                    orderIndex: "asc",
                },
                include: {
                    assignments: {
                        orderBy: {
                            orderIndex: "asc",
                        },
                    },
                },
            },
        },
    });

    if (!classItem) {
        return redirect("/");
    }

    // Redirect to first assignment of first module
    if (classItem.modules.length > 0 && classItem.modules[0].assignments.length > 0) {
        return redirect(`/learn/${classItem.id}/assignment/${classItem.modules[0].assignments[0].id}`);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-medium">Lớp học trống</h2>
            <p className="text-muted-foreground">Lớp học này chưa có bài tập nào.</p>
        </div>
    );
}
