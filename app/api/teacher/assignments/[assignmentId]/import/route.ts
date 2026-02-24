import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Simple CSV parser helper (MVP)
// Expected format: type,content,correctAnswer,points
function parseCSV(csvText: string) {
    const lines = csvText.split(/\r?\n/);
    const questions = [];
    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [type, content, correctAnswer, points] = line.split(',');

        // Basic validation
        if (!type || !content) continue;

        questions.push({
            type: type.toUpperCase(),
            content: content,
            correctAnswer: correctAnswer || "",
            points: parseInt(points) || 1
        });
    }
    return questions;
}

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

        // Verify ownership
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: true }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const text = await file.text();
        const questions = parseCSV(text);

        if (questions.length === 0) {
            return new NextResponse("No valid questions found", { status: 400 });
        }

        // Batch create
        await prisma.question.createMany({
            data: questions.map(q => ({
                assignmentId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: q.type as any, // Simple cast for MVP
                content: q.content,
                correctAnswer: q.correctAnswer,
                points: q.points
            }))
        });

        return NextResponse.json({ count: questions.length });
    } catch (error) {
        console.error("[IMPORT_CSV]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
