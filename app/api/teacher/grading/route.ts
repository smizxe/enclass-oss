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
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

        // Get all classes owned by this teacher
        const teacherClasses = await prisma.class.findMany({
            where: { teacherId: session.user.id },
            select: { id: true }
        });

        const classIds = teacherClasses.map(c => c.id);

        const whereClause: any = {
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
            whereClause.gradedAt = null;
            whereClause.assignmentProgress.assignment.type = { in: ["ESSAY", "LECTURE", "QUIZ", "TEST"] };
            whereClause.assignmentProgress.assignment.questions = {
                some: {
                    type: { in: ["ESSAY", "WRITING", "SPEAKING"] }
                }
            };
        }

        const [totalCount, submissions] = await Promise.all([
            prisma.submission.count({ where: whereClause }),
            prisma.submission.findMany({
                where: whereClause,
                select: {
                    id: true,
                    submittedAt: true,
                    attemptNumber: true,
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
                orderBy: { submittedAt: "desc" },
                skip: (page - 1) * limit,
                take: limit
            })
        ]);

        return NextResponse.json({
            data: submissions,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error("[GRADING_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
