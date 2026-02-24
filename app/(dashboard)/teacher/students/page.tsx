import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StudentsPageClient from "./students-page-client";
import { getTeacherStudentsData } from "../data";
import prisma from "@/lib/prisma";

export default async function StudentsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    const [students, classes] = await Promise.all([
        getTeacherStudentsData(session.user.id),
        prisma.class.findMany({
            where: { teacherId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: { id: true, title: true }
        })
    ]);

    const initialStudents = students.map((student) => ({
        ...student,
        createdAt: student.createdAt instanceof Date
            ? student.createdAt.toISOString()
            : new Date(student.createdAt).toISOString()
    }));

    return <StudentsPageClient initialStudents={initialStudents} classes={classes} />;
}
