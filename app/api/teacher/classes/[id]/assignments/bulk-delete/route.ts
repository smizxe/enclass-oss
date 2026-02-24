import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentIds } = await req.json();

        if (!assignmentIds || !Array.isArray(assignmentIds)) {
            return new NextResponse("Invalid IDs", { status: 400 });
        }

        await prisma.assignment.deleteMany({
            where: {
                id: { in: assignmentIds }
            }
        });

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("[BULK_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
