import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teacherId = session.user.id;

        const [classesCount, activeClassesCount, uniqueStudents] = await Promise.all([
            prisma.class.count({
                where: { teacherId }
            }),
            prisma.class.count({
                where: {
                    teacherId,
                    published: true
                }
            }),
            prisma.classMember.findMany({
                where: {
                    class: {
                        teacherId
                    }
                },
                distinct: ['userId'],
                select: { userId: true }
            })
        ]);

        return NextResponse.json({
            totalClasses: classesCount,
            activeClasses: activeClassesCount,
            totalStudents: uniqueStudents.length
        });
    } catch (error) {
        console.error("[TEACHER_STATS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
