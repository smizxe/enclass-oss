import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const gradeSchema = z.object({
    score: z.number().min(0).max(10),
    feedback: z.string().optional(),
});

// PATCH: Grade a submission
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { submissionId } = await params;
        const body = await req.json();
        const { score, feedback } = gradeSchema.parse(body);

        // Verify submission exists and belongs to teacher's class
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                assignmentProgress: {
                    include: {
                        assignment: {
                            include: { class: true }
                        }
                    }
                }
            }
        });

        if (!submission) {
            return new NextResponse("Submission not found", { status: 404 });
        }

        if (submission.assignmentProgress.assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Update submission with grade
        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                score,
                feedback,
                gradedAt: new Date(),
                gradedById: session.user.id
            }
        });

        // Update assignment progress status
        await prisma.assignmentProgress.update({
            where: { id: submission.assignmentProgressId },
            data: {
                status: "COMPLETED",
                score
            }
        });

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        console.error("[GRADING_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// GET: Get single submission details
export async function GET(
    req: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { submissionId } = await params;

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                assignmentProgress: {
                    include: {
                        assignment: {
                            include: {
                                questions: true,
                                class: { select: { title: true, teacherId: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!submission) {
            return new NextResponse("Submission not found", { status: 404 });
        }

        if (submission.assignmentProgress.assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return NextResponse.json(submission);
    } catch (error) {
        console.error("[GRADING_GET_ONE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
