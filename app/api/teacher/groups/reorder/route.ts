import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    revalidateStudentsForClass,
    revalidateTeacherTags
} from "@/lib/cache-invalidation";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { list } = await req.json(); // Array of { id, orderIndex }
        const groupIds = (list as Array<{ id: string }>).map((item) => item.id);

        const groups = await prisma.assignmentGroup.findMany({
            where: { id: { in: groupIds } },
            include: {
                class: {
                    select: { teacherId: true }
                }
            }
        });
        if (groups.length !== groupIds.length) {
            return new NextResponse("Some groups not found", { status: 404 });
        }
        if (groups.some((group) => group.class.teacherId !== session.user.id)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        for (const item of list) {
            await prisma.assignmentGroup.update({
                where: { id: item.id },
                data: { orderIndex: item.orderIndex }
            });
        }

        revalidateTeacherTags(session.user.id);

        const classes = await prisma.assignmentGroup.findMany({
            where: { id: { in: groupIds } },
            distinct: ["classId"],
            select: { classId: true }
        });
        for (const cls of classes) {
            await revalidateStudentsForClass(cls.classId);
        }

        return NextResponse.json({ message: "Reordered" });
    } catch (error) {
        console.error("[GROUPS_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
