import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const assignmentId = searchParams.get("assignmentId");

        // Get all classes owned by this teacher
        const teacherClasses = await prisma.class.findMany({
            where: { teacherId: session.user.id },
            select: { id: true }
        });

        const classIds = teacherClasses.map(c => c.id);

        let whereClause: any = {
            assignmentProgress: {
                assignment: {
                    classId: { in: classIds }
                }
            }
        };

        if (assignmentId) {
            // If viewing specific assignment, show ALL submissions (graded or not)
            whereClause.assignmentProgress.assignment.id = assignmentId;
        } else {
            // Default view: Show only pending manual grading tasks (Essay/Speaking/Writing)
            // But user might want to see Speaking/Writing too, not just Essay
            whereClause.gradedAt = null;
            whereClause.assignmentProgress.assignment.type = { in: ["ESSAY", "LECTURE", "QUIZ", "TEST"] }; // Just filter generally or maybe restrict types?
            // Actually, best to just show "pending" items if no assignment selected.
            whereClause.assignmentProgress.assignment.questions = {
                some: {
                    type: { in: ["ESSAY", "WRITING", "SPEAKING"] }
                }
            };
        }

        const submissions = await prisma.submission.findMany({
            where: whereClause,
            select: {
                id: true,
                submittedAt: true,
                attemptNumber: true,  // Include attempt number
                answers: true,
                score: true,
                feedback: true,
                gradedAt: true,
                gradedById: true,
                user: {
                    select: { id: true, name: true, email: true }
                },
                assignmentProgress: {
                    select: {
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
