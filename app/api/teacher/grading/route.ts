import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all submissions pending grading for teacher's classes
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get all classes owned by this teacher
        const teacherClasses = await prisma.class.findMany({
            where: { teacherId: session.user.id },
            select: { id: true }
        });

        const classIds = teacherClasses.map(c => c.id);

        // Get all pending submissions from those classes
        const submissions = await prisma.submission.findMany({
            where: {
                gradedAt: null, // Not graded yet
                assignmentProgress: {
                    assignment: {
                        classId: { in: classIds },
                        type: "ESSAY" // Only essay type needs manual grading
                    }
                }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                assignmentProgress: {
                    include: {
                        assignment: {
                            select: { id: true, title: true, classId: true }
                        }
                    }
                }
            },
            orderBy: { submittedAt: "desc" }
        });

        return NextResponse.json(submissions);
    } catch (error) {
        console.error("[GRADING_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
