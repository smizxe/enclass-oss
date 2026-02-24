import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;
        const body = await req.json();
        const { type, content, correctAnswer, points } = body;

        // Verify ownership via Assignment -> Class -> Teacher
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                class: true
            }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const question = await prisma.question.create({
            data: {
                assignmentId,
                type,
                content,
                correctAnswer, // String
                points: points || 1
            }
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const { assignmentId } = await params;

        const questions = await prisma.question.findMany({
            where: {
                assignmentId
            },
            orderBy: [
                { orderIndex: "asc" },
                { createdAt: "asc" }
            ]
        });

        return NextResponse.json(questions);
    } catch (error) {
        console.error("[QUESTIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
