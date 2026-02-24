import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { list } = await req.json(); // Array of { id, orderIndex }

        for (const item of list) {
            await prisma.assignmentGroup.update({
                where: { id: item.id },
                data: { orderIndex: item.orderIndex }
            });
        }

        return NextResponse.json({ message: "Reordered" });
    } catch (error) {
        console.error("[GROUPS_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
