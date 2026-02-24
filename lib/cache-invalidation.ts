import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";

export function revalidateTeacherTags(teacherId: string) {
    revalidateTag(`teacher-dashboard:${teacherId}`, "max");
    revalidateTag(`teacher-classes:${teacherId}`, "max");
    revalidateTag(`teacher-students:${teacherId}`, "max");
}

export function revalidateStudentTags(studentId: string) {
    revalidateTag(`student-dashboard:${studentId}`, "max");
    revalidateTag(`student-classes:${studentId}`, "max");
    revalidateTag(`student-progress:${studentId}`, "max");
}

export async function revalidateStudentsForClass(classId: string) {
    const classMembers = await prisma.classMember.findMany({
        where: { classId },
        distinct: ["userId"],
        select: { userId: true }
    });

    for (const member of classMembers) {
        revalidateStudentTags(member.userId);
    }
}
