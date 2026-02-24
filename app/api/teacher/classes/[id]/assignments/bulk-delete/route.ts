import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    revalidateStudentsForClass,
    revalidateTeacherTags
} from "@/lib/cache-invalidation";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: classId } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentIds } = await req.json();

        if (!assignmentIds || !Array.isArray(assignmentIds)) {
            return new NextResponse("Invalid IDs", { status: 400 });
        }

        const ownedClass = await prisma.class.findFirst({
            where: { id: classId, teacherId: session.user.id },
            select: { id: true }
        });
        if (!ownedClass) {
            return new NextResponse("Class not found", { status: 404 });
        }

        const assignments = await prisma.assignment.findMany({
            where: {
                id: { in: assignmentIds as string[] },
                classId
            },
            distinct: ["classId"],
            select: { classId: true }
        });

        if (assignments.length === 0) {
            return new NextResponse("No assignments found", { status: 404 });
        }

        await prisma.assignment.deleteMany({
            where: {
                id: { in: assignmentIds },
                classId
            }
        });

        revalidateTeacherTags(session.user.id);
        for (const assignment of assignments) {
            await revalidateStudentsForClass(assignment.classId);
        }

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("[BULK_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
