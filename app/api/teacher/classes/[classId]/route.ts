import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const classSchema = z.object({
    published: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: { classId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const { classId } = params;
        const values = await req.json();

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const parsedValues = classSchema.parse(values);

        const classObj = await prisma.class.update({
            where: {
                id: classId,
            },
            data: {
                ...parsedValues,
            },
        });

        return NextResponse.json(classObj);
    } catch (error) {
        console.error("[CLASS_ID_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { classId: string } }
) {
    try {
        const classObj = await prisma.class.findUnique({
            where: {
                id: params.classId,
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

        return NextResponse.json(classObj);
    } catch (error) {
        console.error("[CLASS_ID_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
