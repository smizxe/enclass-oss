import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const assignmentSchema = z.object({
    title: z.string().min(1),
    content: z.string().optional(),
    type: z.enum(["LECTURE", "QUIZ", "TEST", "ESSAY"]),
    settings: z.any().optional(),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;

        const assignment = await prisma.assignment.findUnique({
            where: {
                id: assignmentId,
            },
            include: {
                class: true,
            }
        });

        if (!assignment) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Allow if teacher owns class OR if admin (future proof)
        if (assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
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
        const { title, content, type, settings } = assignmentSchema.parse(body);

        const assignment = await prisma.assignment.findUnique({
            where: {
                id: assignmentId,
            },
            include: {
                class: true,
            }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const updatedAssignment = await prisma.assignment.update({
            where: {
                id: assignmentId,
            },
            data: {
                title,
                content,
                type,
                settings,
            },
        });

        return NextResponse.json(updatedAssignment);
    } catch (error) {
        console.error("[ASSIGNMENT_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;

        const assignment = await prisma.assignment.findUnique({
            where: {
                id: assignmentId,
            },
            include: {
                class: true,
            }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const deletedAssignment = await prisma.assignment.delete({
            where: {
                id: assignmentId,
            },
        });

        return NextResponse.json(deletedAssignment);
    } catch (error) {
        console.error("[ASSIGNMENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
