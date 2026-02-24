import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";

type WeeklyProgressRow = {
    userId: string;
    status: string;
    score: number | null;
    updatedAt: Date;
};

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: classId } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const hasDateRange = Boolean(startDateParam && endDateParam);
        const parsedStart = startDateParam ? parseISO(startDateParam) : null;
        const parsedEnd = endDateParam ? parseISO(endDateParam) : null;
        const isValidRange = Boolean(parsedStart && parsedEnd && isValid(parsedStart) && isValid(parsedEnd));
        const rangeStart = isValidRange && parsedStart ? startOfDay(parsedStart).getTime() : null;
        const rangeEnd = isValidRange && parsedEnd ? endOfDay(parsedEnd).getTime() : null;

        const students = await prisma.classMember.findMany({
            where: {
                classId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        const studentIds = students.map((member) => member.userId);

        const [totalAssignments, allProgress] = await Promise.all([
            prisma.assignment.count({
                where: {
                    classId
                }
            }),
            studentIds.length > 0
                ? prisma.assignmentProgress.findMany({
                    where: {
                        userId: {
                            in: studentIds
                        },
                        assignment: {
                            classId
                        }
                    },
                    select: {
                        userId: true,
                        status: true,
                        score: true,
                        updatedAt: true
                    }
                })
                : Promise.resolve<WeeklyProgressRow[]>([])
        ]);

        const progressByStudent = new Map<string, WeeklyProgressRow[]>();
        for (const progressItem of allProgress) {
            const list = progressByStudent.get(progressItem.userId);
            if (list) {
                list.push(progressItem);
            } else {
                progressByStudent.set(progressItem.userId, [progressItem]);
            }
        }

        const progressData = students.map((member) => {
            const studentId = member.userId;
            const userProgress = progressByStudent.get(studentId) || [];

            const completedTotal = userProgress.filter((progressItem) => progressItem.status === "COMPLETED").length;

            let completedInWeek = 0;
            let scoreSum = 0;
            let scoredCount = 0;

            for (const progressItem of userProgress) {
                let inRange = true;

                if (hasDateRange) {
                    if (isValidRange && rangeStart !== null && rangeEnd !== null) {
                        const updatedTime = new Date(progressItem.updatedAt).getTime();
                        inRange = updatedTime >= rangeStart && updatedTime <= rangeEnd;
                    } else {
                        inRange = false;
                    }
                }

                if (inRange && progressItem.status === "COMPLETED") {
                    completedInWeek++;
                }

                if (inRange && progressItem.score !== null) {
                    scoreSum += progressItem.score;
                    scoredCount++;
                }
            }

            const avgScore = scoredCount > 0 ? scoreSum / scoredCount : 0;
            const completionPercentage = totalAssignments > 0
                ? (completedTotal / totalAssignments) * 100
                : 0;

            return {
                id: studentId,
                name: member.user.name || "Unknown",
                email: member.user.email,
                totalAssignments,
                completedTotal,
                completionPercentage,
                completedInWeek,
                avgScore,
                weeklyActivity: completedInWeek > 0
            };
        });

        return NextResponse.json({
            classId,
            totalAssignments,
            students: progressData
        });
    } catch (error) {
        console.error("[CLASS_PROGRESS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
