import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTeacherTags } from "@/lib/cache-invalidation";

const classSchema = z.object({
    published: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;
        const values = await req.json();

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const parsedValues = classSchema.parse(values);
        const ownedClass = await prisma.class.findFirst({
            where: {
                id,
                teacherId: session.user.id
            },
            select: { id: true }
        });

        if (!ownedClass) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const classObj = await prisma.class.update({
            where: {
                id: id,
            },
            data: {
                ...parsedValues,
            },
        });

        revalidateTeacherTags(session.user.id);

        return NextResponse.json(classObj);
    } catch (error) {
        console.error("[CLASS_ID_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const view = searchParams.get("view");

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (view === "grading") {
            const classObj = await prisma.class.findUnique({
                where: {
                    id: id,
                },
                include: {
                    assignments: {
                        orderBy: {
                            orderIndex: "asc",
                        },
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            classId: true
                        }
                    },
                    _count: {
                        select: { members: true }
                    }
                }
            });

            if (!classObj || classObj.teacherId !== session.user.id) {
                return new NextResponse("Not Found", { status: 404 });
            }

            return NextResponse.json(classObj);
        }

        const classObj = await prisma.class.findUnique({
            where: {
                id: id,
            },
            include: {
                assignments: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                    include: {
                        questions: true
                    }
                },
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!classObj || classObj.teacherId !== session.user.id) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(classObj);
    } catch (error) {
        console.error("[CLASS_ID_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
