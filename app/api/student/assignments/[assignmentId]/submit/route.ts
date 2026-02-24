import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST: Submit answers for an assignment
export async function POST(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;
        const body = await req.json();
        const { answers } = body;

        if (!answers || typeof answers !== "object") {
            return new NextResponse("Invalid answers format", { status: 400 });
        }

        // Get or create assignment progress
        let progress = await prisma.assignmentProgress.findUnique({
            where: {
                userId_assignmentId: {
                    userId: session.user.id,
                    assignmentId
                }
            },
            include: {
                assignment: true
            }
        });

        if (!progress) {
            progress = await prisma.assignmentProgress.create({
                data: {
                    userId: session.user.id,
                    assignmentId,
                    status: "IN_PROGRESS"
                },
                include: {
                    assignment: true
                }
            });
        }

        // Check assignment type to determine status
        const isEssay = progress.assignment.type === "ESSAY";
        const newStatus = isEssay ? "PENDING_GRADING" : "COMPLETED";

        // Create submission
        const submission = await prisma.submission.create({
            data: {
                userId: session.user.id,
                assignmentProgressId: progress.id,
                answers: JSON.stringify(answers)
                // score is optional and will be set when graded (for essays)
                // or could be auto-calculated here for MCQ/other types
            }
        });

        // Update progress status
        await prisma.assignmentProgress.update({
            where: { id: progress.id },
            data: { status: newStatus }
        });

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            status: newStatus
        });
    } catch (error) {
        console.error("[SUBMIT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
