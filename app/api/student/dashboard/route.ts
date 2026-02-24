import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;

        // Get enrolled classes with assignments
        const enrollments = await prisma.classMember.findMany({
            where: { userId },
            include: {
                class: {
                    include: {
                        assignments: {
                            orderBy: { createdAt: "desc" }
                        }
                    }
                }
            }
        });

        // Get all assignment progress for this user
        const allProgress = await prisma.assignmentProgress.findMany({
            where: { userId },
            select: {
                assignmentId: true,
                status: true,
                score: true
            }
        });

        // Create a map for quick lookup
        const progressMap = new Map(
            allProgress.map(p => [p.assignmentId, p])
        );

        // Process data
        let totalCompleted = 0;
        let totalScore = 0;
        let scoreCount = 0;
        const pendingAssignments: {
            id: string;
            title: string;
            type: string;
            classId: string;
            className: string;
            createdAt: Date;
        }[] = [];
        const classes: {
            id: string;
            title: string;
            description: string | null;
            progress: number;
            totalAssignments: number;
            completedAssignments: number;
        }[] = [];

        for (const enrollment of enrollments) {
            const classData = enrollment.class;
            let classCompleted = 0;
            let classTotal = 0;

            for (const assignment of classData.assignments) {
                classTotal++;
                const progress = progressMap.get(assignment.id);

                if (progress?.status === "COMPLETED") {
                    totalCompleted++;
                    classCompleted++;
                    if (progress.score !== null && progress.score !== undefined) {
                        totalScore += progress.score;
                        scoreCount++;
                    }
                } else {
                    // Pending assignment
                    pendingAssignments.push({
                        id: assignment.id,
                        title: assignment.title,
                        type: assignment.type,
                        classId: classData.id,
                        className: classData.title,
                        createdAt: assignment.createdAt
                    });
                }
            }

            classes.push({
                id: classData.id,
                title: classData.title,
                description: classData.description,
                progress: classTotal > 0 ? Math.round((classCompleted / classTotal) * 100) : 0,
                totalAssignments: classTotal,
                completedAssignments: classCompleted
            });
        }

        // Get recent submissions
        const recentSubmissions = await prisma.submission.findMany({
            where: { userId },
            orderBy: { submittedAt: "desc" },
            take: 5,
            include: {
                assignmentProgress: {
                    include: {
                        assignment: {
                            include: {
                                class: true
                            }
                        }
                    }
                }
            }
        });

        const recentActivity = recentSubmissions.map(sub => ({
            id: sub.id,
            assignmentId: sub.assignmentProgress.assignment.id,
            assignmentTitle: sub.assignmentProgress.assignment.title,
            assignmentType: sub.assignmentProgress.assignment.type,
            classId: sub.assignmentProgress.assignment.classId,
            className: sub.assignmentProgress.assignment.class.title,
            score: sub.score,
            submittedAt: sub.submittedAt
        }));

        // Calculate average score
        const averageScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : null;

        return NextResponse.json({
            stats: {
                totalCompleted,
                averageScore,
                totalClasses: classes.length,
                pendingCount: pendingAssignments.length
            },
            pendingAssignments: pendingAssignments.slice(0, 6), // Limit to 6
            recentActivity,
            classes
        });
    } catch (error) {
        console.error("[STUDENT_DASHBOARD_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
