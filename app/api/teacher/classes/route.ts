import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const courseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, description } = courseSchema.parse(body);

        const classObj = await prisma.class.create({
            data: {
                title,
                description,
                teacherId: session.user.id,
            },
        });

        return NextResponse.json(classObj);
    } catch (error) {
        console.error("[CLASSES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const classes = await prisma.class.findMany({
            where: {
                teacherId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(classes);
    } catch (error) {
        console.error("[COURSES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
