import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    revalidateStudentsForClass,
    revalidateTeacherTags
} from "@/lib/cache-invalidation";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // classId
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: classId } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const ownedClass = await prisma.class.findFirst({
            where: { id: classId, teacherId: session.user.id },
            select: { id: true }
        });

        if (!ownedClass) {
            return new NextResponse("Class not found", { status: 404 });
        }

        const groups = await prisma.assignmentGroup.findMany({
            where: {
                classId,
            },
            include: {
                assignments: {
                    orderBy: {
                        orderIndex: 'asc'
                    }
                }
            },
            orderBy: {
                orderIndex: 'asc'
            }
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error("[GROUPS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // classId
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: classId } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const ownedClass = await prisma.class.findFirst({
            where: { id: classId, teacherId: session.user.id },
            select: { id: true }
        });

        if (!ownedClass) {
            return new NextResponse("Class not found", { status: 404 });
        }

        const { title } = await req.json();

        const lastGroup = await prisma.assignmentGroup.findFirst({
            where: { classId },
            orderBy: { orderIndex: 'desc' },
        });

        const newOrderIndex = lastGroup ? lastGroup.orderIndex + 1 : 1;

        const group = await prisma.assignmentGroup.create({
            data: {
                classId,
                title,
                orderIndex: newOrderIndex,
            }
        });

        revalidateTeacherTags(session.user.id);
        await revalidateStudentsForClass(classId);

        return NextResponse.json(group);
    } catch (error) {
        console.error("[GROUPS_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
