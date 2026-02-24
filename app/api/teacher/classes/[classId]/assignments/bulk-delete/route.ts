import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ classId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { classId } = await params;
        const { assignmentIds } = await req.json();

        if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
            return new NextResponse("No assignments selected", { status: 400 });
        }

        const classItem = await prisma.class.findUnique({
            where: {
                id: classId,
                teacherId: session.user.id,
            },
        });

        if (!classItem) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.assignment.deleteMany({
            where: {
                id: {
                    in: assignmentIds,
                },
                classId: classId, // Double check ownership
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ASSIGNMENT_BULK_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
