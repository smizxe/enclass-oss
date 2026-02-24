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

        const body = await req.json();
        const { updates } = body; // Array of { id, orderIndex, groupId? }

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

        return NextResponse.json({ message: "Reordered" });
    } catch (error) {
        console.error("[ASSIGNMENTS_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
