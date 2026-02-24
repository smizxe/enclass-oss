import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: { classId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { email } = await req.json();

        // Check if class belongs to teacher
        const classItem = await prisma.class.findUnique({
            where: {
                id: params.classId,
                teacherId: session.user.id
            }
        });

        if (!classItem) {
            return new NextResponse("Class not found", { status: 404 });
        }

        // Find student
        const student = await prisma.user.findUnique({
            where: { email }
        });

        if (!student) {
            return new NextResponse("Student not found", { status: 404 });
        }

        // Add to class
        await prisma.classMember.create({
            data: {
                classId: params.classId,
                userId: student.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CLASS_MEMBER_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { classId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const classMembers = await prisma.classMember.findMany({
            where: {
                classId: params.classId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                joinedAt: "desc"
            }
        });

        return NextResponse.json(classMembers);
    } catch (error) {
        console.error("[CLASS_MEMBER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
