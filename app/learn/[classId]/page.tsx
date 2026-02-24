import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function ClassIdPage({
    params
}: {
    params: Promise<{ classId: string; }>
}) {
    const { classId } = await params;

    const classItem = await prisma.class.findUnique({
        where: {
            id: classId,
        },
        include: {
            assignments: {
                orderBy: {
                    orderIndex: "asc",
                },
            },
        },
    });

    if (!classItem) {
        return redirect("/");
    }

    // Redirect to first assignment
    if (classItem.assignments.length > 0) {
        return redirect(`/learn/${classItem.id}/assignments/${classItem.assignments[0].id}`);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-medium">Lớp học trống</h2>
            <p className="text-muted-foreground">Lớp học này chưa có bài tập nào.</p>
        </div>
    );
}
