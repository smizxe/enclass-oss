import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const assignmentSchema = z.object({
    title: z.string().min(1),
    classId: z.string().min(1),
    type: z.enum(["LECTURE", "QUIZ", "TEST", "ESSAY"]).default("LECTURE"),
    orderIndex: z.number().int().default(0),
    content: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, classId, type, orderIndex, content } = assignmentSchema.parse(body);

        // Verify class ownership
        const classRecord = await prisma.class.findUnique({
            where: { id: classId },
        });

        if (!classRecord || classRecord.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const assignment = await prisma.assignment.create({
            data: {
                title,
                classId,
                type,
                orderIndex,
                content
            },
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
