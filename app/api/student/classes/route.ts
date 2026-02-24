import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const enrollments = await prisma.classMember.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                class: true,
            },
            orderBy: {
                joinedAt: "desc",
            },
        });

        const courses = enrollments.map((enrollment) => enrollment.class);

        return NextResponse.json(courses);
    } catch (error) {
        console.error("[STUDENT_COURSES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
