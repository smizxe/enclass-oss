import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

const TEACHER_REVALIDATE_SECONDS = 60;

type TeacherDashboardStats = {
    totalClasses: number;
    activeClasses: number;
    totalStudents: number;
};

type TeacherDashboardClass = {
    id: string;
    title: string;
    description: string | null;
    published: boolean;
    createdAt: Date;
};

export const getTeacherDashboardData = (teacherId: string) =>
    unstable_cache(
        async (): Promise<{ classes: TeacherDashboardClass[]; stats: TeacherDashboardStats }> => {
            const [classes, totalClasses, activeClasses, uniqueStudents] = await Promise.all([
                prisma.class.findMany({
                    where: {
                        teacherId
                    },
                    orderBy: {
                        createdAt: "desc"
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        published: true,
                        createdAt: true
                    }
                }),
                prisma.class.count({
                    where: { teacherId }
                }),
                prisma.class.count({
                    where: {
                        teacherId,
                        published: true
                    }
                }),
                prisma.classMember.findMany({
                    where: {
                        class: {
                            teacherId
                        }
                    },
                    distinct: ["userId"],
                    select: {
                        userId: true
                    }
                })
            ]);

            return {
                classes,
                stats: {
                    totalClasses,
                    activeClasses,
                    totalStudents: uniqueStudents.length
                }
            };
        },
        ["teacher-dashboard", teacherId],
        {
            revalidate: TEACHER_REVALIDATE_SECONDS,
            tags: [
                `teacher-dashboard:${teacherId}`,
                `teacher-classes:${teacherId}`,
                `teacher-students:${teacherId}`
            ]
        }
    )();

export const getTeacherClassesForGrading = (teacherId: string) =>
    unstable_cache(
        async () => prisma.class.findMany({
            where: {
                teacherId
            },
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                title: true,
                description: true
            }
        }),
        ["teacher-grading-classes", teacherId],
        {
            revalidate: TEACHER_REVALIDATE_SECONDS,
            tags: [
                `teacher-classes:${teacherId}`
            ]
        }
    )();

export const getTeacherStudentsData = (teacherId: string) =>
    unstable_cache(
        async () => prisma.user.findMany({
            where: {
                role: "STUDENT",
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                classMembers: {
                    select: {
                        id: true,
                        classId: true,
                        class: {
                            select: {
                                title: true
                            }
                        }
                    }
                }
            }
        }),
        ["teacher-students-page", teacherId],
        {
            revalidate: TEACHER_REVALIDATE_SECONDS,
            tags: [
                `teacher-students:${teacherId}`
            ]
        }
    )();
