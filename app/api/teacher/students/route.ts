import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";

const studentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, email, password } = studentSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return new NextResponse("Email already in use", { status: 400 });
        }

        const hashedPassword = await hash(password, 12);

        const student = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "STUDENT",
                createdById: session.user.id,
            },
        });

        // Remove password from response
        const { password: _, ...result } = student;

        return NextResponse.json(result);
    } catch (error) {
        console.error("[STUDENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT",
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                // Do not return password
            }
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("[STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
