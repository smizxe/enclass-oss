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

        // SOFTWARE-SIDE CASCADE DELETE
        // Chain: Submission -> AssignmentProgress -> Assignment

        // 1. Delete Submissions dependent on the Progress
        await prisma.submission.deleteMany({
            where: {
                assignmentProgress: {
                    assignmentId: {
                        in: assignmentIds
                    }
                }
            }
        });

        // 2. Delete AssignmentProgress
        await prisma.assignmentProgress.deleteMany({
            where: {
                assignmentId: {
                    in: assignmentIds
                }
            }
        });

        // Question deletion is handled by DB Cascade (if set) or we should ensure it too.
        // Checking schema: Question HAS onDelete: Cascade. So this is fine.

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
