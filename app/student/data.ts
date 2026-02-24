import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

type StudentClassSummary = {
    id: string;
    title: string;
    description: string | null;
    progress: number;
    totalAssignments: number;
    completedAssignments: number;
};

const STUDENT_REVALIDATE_SECONDS = 60;

const getStudentDashboardDataCached = (userId: string) =>
    unstable_cache(
        async () => {
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

            const allProgress = await prisma.assignmentProgress.findMany({
                where: { userId },
                select: {
                    assignmentId: true,
                    status: true,
                    score: true
                }
            });

            const progressMap = new Map(allProgress.map((progress) => [progress.assignmentId, progress]));

            let totalCompleted = 0;
            let totalAssignmentsCount = 0;
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
            const classes: StudentClassSummary[] = [];

            for (const enrollment of enrollments) {
                const classData = enrollment.class;
                let classCompleted = 0;
                let classTotal = 0;

                for (const assignment of classData.assignments) {
                    classTotal++;
                    totalAssignmentsCount++;
                    const progress = progressMap.get(assignment.id);

                    if (progress?.status === "COMPLETED") {
                        totalCompleted++;
                        classCompleted++;
                        if (progress.score !== null && progress.score !== undefined) {
                            totalScore += progress.score;
                            scoreCount++;
                        }
                    } else {
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

            const recentActivity = recentSubmissions.map((submission) => ({
                id: submission.id,
                assignmentId: submission.assignmentProgress.assignment.id,
                assignmentTitle: submission.assignmentProgress.assignment.title,
                assignmentType: submission.assignmentProgress.assignment.type,
                classId: submission.assignmentProgress.assignment.classId,
                className: submission.assignmentProgress.assignment.class.title,
                score: submission.score,
                submittedAt: submission.submittedAt.toISOString()
            }));

            const averageScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : null;

            return {
                stats: {
                    totalCompleted,
                    averageScore,
                    totalClasses: classes.length,
                    pendingCount: pendingAssignments.length,
                    totalAssignments: totalAssignmentsCount
                },
                pendingAssignments: pendingAssignments.slice(0, 6),
                recentActivity,
                classes
            };
        },
        ["student-dashboard", userId],
        {
            revalidate: STUDENT_REVALIDATE_SECONDS,
            tags: [
                `student-dashboard:${userId}`,
                `student-classes:${userId}`,
                `student-progress:${userId}`
            ]
        }
    )();

const getStudentProgressCountsCached = (userId: string) =>
    unstable_cache(
        async () => {
            const enrollments = await prisma.classMember.findMany({
                where: { userId },
                select: { classId: true }
            });

            const classIds = enrollments.map((item) => item.classId);

            if (classIds.length === 0) {
                return {
                    totalAssignments: 0,
                    completedAssignments: 0
                };
            }

            const [totalAssignments, completedAssignments] = await Promise.all([
                prisma.assignment.count({
                    where: {
                        classId: {
                            in: classIds
                        }
                    }
                }),
                prisma.assignmentProgress.count({
                    where: {
                        userId,
                        status: "COMPLETED",
                        assignment: {
                            classId: {
                                in: classIds
                            }
                        }
                    }
                })
            ]);

            return {
                totalAssignments,
                completedAssignments
            };
        },
        ["student-progress-counts", userId],
        {
            revalidate: STUDENT_REVALIDATE_SECONDS,
            tags: [
                `student-classes:${userId}`,
                `student-progress:${userId}`
            ]
        }
    )();

const getStudentClassesCached = (userId: string) =>
    unstable_cache(
        async (): Promise<StudentClassSummary[]> => {
            const enrollments = await prisma.classMember.findMany({
                where: { userId },
                include: {
                    class: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            assignments: {
                                select: {
                                    id: true
                                }
                            }
                        }
                    }
                }
            });

            const classIds = enrollments.map((item) => item.class.id);
            const completedProgress = classIds.length > 0
                ? await prisma.assignmentProgress.findMany({
                    where: {
                        userId,
                        status: "COMPLETED",
                        assignment: {
                            classId: {
                                in: classIds
                            }
                        }
                    },
                    select: {
                        assignment: {
                            select: {
                                classId: true
                            }
                        }
                    }
                })
                : [];

            const completedCountByClass = new Map<string, number>();
            for (const progress of completedProgress) {
                const classId = progress.assignment.classId;
                completedCountByClass.set(classId, (completedCountByClass.get(classId) || 0) + 1);
            }

            return enrollments.map((enrollment) => {
                const classData = enrollment.class;
                const totalAssignments = classData.assignments.length;
                const completedAssignments = completedCountByClass.get(classData.id) || 0;

                return {
                    id: classData.id,
                    title: classData.title,
                    description: classData.description,
                    progress: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
                    totalAssignments,
                    completedAssignments
                };
            });
        },
        ["student-classes-list", userId],
        {
            revalidate: STUDENT_REVALIDATE_SECONDS,
            tags: [
                `student-classes:${userId}`,
                `student-progress:${userId}`
            ]
        }
    )();

export const getStudentDashboardData = cache(async () => {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
        return null;
    }

    return getStudentDashboardDataCached(session.user.id);
});

export const getStudentProgressCounts = cache(async () => {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
        return null;
    }

    return getStudentProgressCountsCached(session.user.id);
});

export const getStudentClasses = cache(async (): Promise<StudentClassSummary[] | null> => {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
        return null;
    }

    return getStudentClassesCached(session.user.id);
});
