import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
    revalidateStudentTags,
    revalidateTeacherTags
} from "@/lib/cache-invalidation";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const { email } = await req.json();

        // Check if class belongs to teacher
        const classItem = await prisma.class.findFirst({
            where: {
                id: id,
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

        const existingMember = await prisma.classMember.findUnique({
            where: {
                userId_classId: {
                    userId: student.id,
                    classId: id
                }
            }
        });

        if (existingMember) {
            return new NextResponse("Student already in class", { status: 409 });
        }

        // Add to class
        await prisma.classMember.create({
            data: {
                classId: id,
                userId: student.id
            }
        });

        revalidateTeacherTags(session.user.id);
        revalidateStudentTags(student.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CLASS_MEMBER_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        // Verify class ownership
        const classItem = await prisma.class.findFirst({
            where: {
                id: id,
                teacherId: session.user.id
            }
        });

        if (!classItem) {
            return new NextResponse("Class not found", { status: 404 });
        }

        const classMembers = await prisma.classMember.findMany({
            where: {
                classId: id
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
