import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StudentsPageClient from "./students-page-client";
import { getTeacherStudentsData } from "../data";

export default async function StudentsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    const students = await getTeacherStudentsData(session.user.id);

    const initialStudents = students.map((student) => ({
        ...student,
        createdAt: student.createdAt.toISOString()
    }));

    return <StudentsPageClient initialStudents={initialStudents} />;
}
