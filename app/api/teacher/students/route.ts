import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { revalidateTeacherTags } from "@/lib/cache-invalidation";

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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...result } = student;

        revalidateTeacherTags(session.user.id);

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

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
        const search = searchParams.get("search") || "";
        const classId = searchParams.get("classId") || "";

        // Build where clause
        const baseWhere: any = {
            role: "STUDENT",
            OR: [
                { createdById: session.user.id },
                {
                    classMembers: {
                        some: {
                            class: {
                                teacherId: session.user.id
                            }
                        }
                    }
                }
            ]
        };

        // Add search filter
        if (search) {
            baseWhere.AND = [
                {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } }
                    ]
                }
            ];
        }

        // Add class filter
        if (classId) {
            const classFilter = {
                classMembers: {
                    some: { classId }
                }
            };
            if (baseWhere.AND) {
                baseWhere.AND.push(classFilter);
            } else {
                baseWhere.AND = [classFilter];
            }
        }

        // Run count and query in parallel
        const [totalCount, students] = await Promise.all([
            prisma.user.count({ where: baseWhere }),
            prisma.user.findMany({
                where: baseWhere,
                orderBy: {
                    createdAt: "desc",
                },
                skip: (page - 1) * limit,
                take: limit,
                distinct: ["id"],
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    classMembers: {
                        include: {
                            class: {
                                select: {
                                    title: true
                                }
                            }
                        }
                    }
                    // Do not return password
                }
            })
        ]);

        return NextResponse.json({
            data: students,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error("[STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
