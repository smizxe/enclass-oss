
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string; questionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId, questionId } = await params;

        // Verify ownership
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: true }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        await prisma.question.delete({
            where: {
                id: questionId,
                assignmentId: assignmentId
            }
        });

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.error("[QUESTION_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string; questionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId, questionId } = await params;
        const body = await req.json();
        const { type, content, correctAnswer, points } = body;

        // Verify ownership
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: true }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const question = await prisma.question.update({
            where: {
                id: questionId,
                assignmentId: assignmentId
            },
            data: {
                type,
                content,
                correctAnswer,
                points
            }
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
