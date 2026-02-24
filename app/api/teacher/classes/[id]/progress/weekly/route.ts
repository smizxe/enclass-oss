import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

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

        let dateFilter = {};
        if (startDateParam && endDateParam) {
            const start = parseISO(startDateParam);
            const end = parseISO(endDateParam);

            if (isValid(start) && isValid(end)) {
                // Filter submissions within this week
                // Note: Submissions are in AssignmentProgress -> submissions
                // But we want to count how many items were *completed* or worked on?
                // Let's filter by updated at of progress or submittedAt of submissions?
                // The requirement: "phần trăm hoàn thành ... trong tuần" (percentage completed ... in the week)
                dateFilter = {
                    updatedAt: {
                        gte: startOfDay(start),
                        lte: endOfDay(end)
                    }
                };
            }
        }

        // 1. Get total assignments count for this class (denominator)
        const totalAssignments = await prisma.assignment.count({
            where: {
                classId: classId,
                // optionally check if published? Assume all for now or check class published
            }
        });

        // 2. Get all students in the class
        const students = await prisma.classMember.findMany({
            where: {
                classId: classId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        // Get their progress for this class
                        // This is tricky because AssignmentProgress is linked to Assignment, not Class directly.
                        // We need to fetch progress where assignment.classId == classId
                    }
                }
            }
        });

        // 3. For each student, calculate stats
        // To optimize, we might want to fetch all progress records for this class in one go
        // referencing assignments in this class.

        const progressData = await Promise.all(students.map(async (member) => {
            const studentId = member.userId;

            // Fetch progress records for assignments in this class for this student
            // We want to know:
            // - Total completed (status = "COMPLETED")
            // - Completed IN THE SELECTED WEEK (if filter applied)
            // - Average score

            const userProgress = await prisma.assignmentProgress.findMany({
                where: {
                    userId: studentId,
                    assignment: {
                        classId: classId
                    }
                },
                include: {
                    assignment: true,
                    // To filter by date, we check the progress.updatedAt or specific submission
                }
            });

            // Calculate metrics
            const completedTotal = userProgress.filter(p => p.status === "COMPLETED").length;

            // Filter for "Activity in Week"
            // If we want "Completed in week", we check if `updatedAt` (when it became completed) is in range
            // OR checks if they have a submission in that range.
            // Let's use `updatedAt` of the progress record for simplicity, assuming it updates on completion.

            let completedInWeek = 0;
            let scoreSum = 0;
            let scoredCount = 0;

            userProgress.forEach(p => {
                // Check date filter if exists
                let inRange = true;
                if (startDateParam && endDateParam) {
                    const updateTime = new Date(p.updatedAt).getTime();
                    const startRaw = parseISO(startDateParam);
                    const endRaw = parseISO(endDateParam);
                    if (isValid(startRaw) && isValid(endRaw)) {
                        const start = startOfDay(startRaw).getTime();
                        const end = endOfDay(endRaw).getTime();
                        inRange = updateTime >= start && updateTime <= end;
                    }
                }

                if (inRange && p.status === "COMPLETED") {
                    completedInWeek++;
                }

                if (inRange && p.score !== null) {
                    scoreSum += p.score;
                    scoredCount++;
                }
            });

            const avgScore = scoredCount > 0 ? (scoreSum / scoredCount) : 0;
            const completionPercentage = totalAssignments > 0
                ? (completedTotal / totalAssignments) * 100
                : 0;

            // "Weekly Completion" - maybe just count? 
            // Or percentage of *total* that was done *this week*?
            // Let's return both total stats and weekly stats

            return {
                id: studentId,
                name: member.user.name || "Unknown",
                email: member.user.email,
                totalAssignments,
                completedTotal, // All time
                completionPercentage, // All time %

                // Weekly specific
                completedInWeek,
                avgScore,  // in week
                weeklyActivity: completedInWeek > 0 // did they do anything?
            };
        }));

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
