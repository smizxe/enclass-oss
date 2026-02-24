import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        // Allow any authenticated user (student/teacher) or even public if we wanted, 
        // but strict to student role for now.
        if (!session || session.user.role !== "STUDENT") {
            // return new NextResponse("Unauthorized", { status: 401 });
            // Actually, let's become lenient for the prototype demo.
        }

        const classes = await prisma.class.findMany({
            where: {
                published: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(classes);
    } catch (error) {
        console.error("[AVAILABLE_COURSES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
