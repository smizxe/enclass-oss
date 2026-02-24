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

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { updates } = body; // Array of { id, orderIndex, groupId? }
        const { id: classId } = await params;

        const ownedClass = await prisma.class.findFirst({
            where: { id: classId, teacherId: session.user.id },
            select: { id: true }
        });
        if (!ownedClass) {
            return new NextResponse("Class not found", { status: 404 });
        }

        for (const update of updates) {
            const data: any = { orderIndex: update.orderIndex };
            if (update.groupId !== undefined) {
                // If groupId is present (even if null), update it
                data.groupId = update.groupId;
            }

            await prisma.assignment.update({
                where: { id: update.id },
                data
            });
        }

        revalidateTeacherTags(session.user.id);
        await revalidateStudentsForClass(classId);

        return NextResponse.json({ message: "Reordered" });
    } catch (error) {
        console.error("[ASSIGNMENTS_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
