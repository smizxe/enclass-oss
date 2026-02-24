import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    revalidateStudentsForClass,
    revalidateTeacherTags
} from "@/lib/cache-invalidation";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { title, orderIndex } = await req.json();

        const existingGroup = await prisma.assignmentGroup.findUnique({
            where: { id },
            include: {
                class: {
                    select: { teacherId: true }
                }
            }
        });
        if (!existingGroup || existingGroup.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const group = await prisma.assignmentGroup.update({
            where: { id },
            data: { title, orderIndex }
        });

        revalidateTeacherTags(session.user.id);
        await revalidateStudentsForClass(group.classId);

        return NextResponse.json(group);
    } catch (error) {
        console.error("[GROUP_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Before delete, maybe unset assignments group?
        // Or if relation is SetNull on delete, it's fine.
        // My schema didn't specify onDelete behavior for specific field side, 
        // but typically it might error if foreign key constraint.
        // I define `group AssignmentGroup? @relation(fields: [groupId], references: [id])`
        // Default is usually SetNull if optional field? Or Restrict.
        // Let's manually unlink just in case.

        const group = await prisma.assignmentGroup.findUnique({
            where: { id },
            include: {
                class: {
                    select: { teacherId: true }
                }
            }
        });

        if (!group) {
            return new NextResponse("Group not found", { status: 404 });
        }
        if (group.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.assignment.updateMany({
            where: { groupId: id },
            data: { groupId: null }
        });

        await prisma.assignmentGroup.delete({
            where: { id }
        });

        revalidateTeacherTags(session.user.id);
        await revalidateStudentsForClass(group.classId);

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("[GROUP_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
